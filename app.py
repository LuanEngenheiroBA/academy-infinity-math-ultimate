import os
from datetime import datetime, timezone

from flask import Flask, jsonify, render_template, request, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import UniqueConstraint
from werkzeug.security import check_password_hash, generate_password_hash

from data import MODULES, QUIZZES, get_module

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def public(self):
        return {"id": self.id, "name": self.name, "email": self.email}


class Progress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    module_slug = db.Column(db.String(80), nullable=False)
    best_score = db.Column(db.Integer, default=0, nullable=False)
    completed = db.Column(db.Boolean, default=False, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    __table_args__ = (UniqueConstraint("user_id", "module_slug", name="uq_progress_user_module"),)

    def public(self):
        return {"module_slug": self.module_slug, "best_score": self.best_score, "completed": self.completed}


class QuizAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    module_slug = db.Column(db.String(80), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    total = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


def create_app(test_config=None):
    app = Flask(__name__)
    database_url = os.getenv("DATABASE_URL", "sqlite:///academy.db")
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

    app.config.update(
        SECRET_KEY=os.getenv("SECRET_KEY", "dev-change-me"),
        SQLALCHEMY_DATABASE_URI=database_url,
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=os.getenv("VERCEL") == "1",
    )
    if test_config:
        app.config.update(test_config)
    db.init_app(app)

    with app.app_context():
        db.create_all()

    @app.get("/")
    def home():
        return render_template("index.html", modules=MODULES)

    @app.get("/modulos")
    def modules_page():
        return render_template("modules.html", modules=MODULES)

    @app.get("/modulos/<slug>")
    def module_detail(slug):
        module = get_module(slug)
        if not module:
            return render_template("404.html"), 404
        return render_template("module_detail.html", module=module)

    @app.get("/quiz")
    def quizzes_page():
        return render_template("quizzes.html", modules=MODULES)

    @app.get("/quiz/<slug>")
    def quiz_detail(slug):
        module = get_module(slug)
        if not module or slug not in QUIZZES:
            return render_template("404.html"), 404
        return render_template("quiz.html", module=module)

    @app.get("/api/health")
    def health():
        return jsonify(status="ok", database=db.engine.url.get_backend_name())

    @app.get("/api/modules")
    def api_modules():
        return jsonify(MODULES)

    @app.get("/api/modules/<slug>")
    def api_module(slug):
        module = get_module(slug)
        return (jsonify(module), 200) if module else (jsonify(error="Módulo não encontrado."), 404)

    @app.get("/api/quizzes/<slug>")
    def api_quiz(slug):
        questions = QUIZZES.get(slug)
        if not questions:
            return jsonify(error="Quiz não encontrado."), 404
        safe_questions = [{k: v for k, v in question.items() if k != "answer"} for question in questions]
        return jsonify(module=get_module(slug), questions=safe_questions)

    @app.post("/api/quizzes/<slug>/submit")
    def submit_quiz(slug):
        questions = QUIZZES.get(slug)
        if not questions:
            return jsonify(error="Quiz não encontrado."), 404
        payload = request.get_json(silent=True) or {}
        answers = payload.get("answers")
        if not isinstance(answers, list) or len(answers) != len(questions):
            return jsonify(error="Envie uma resposta para cada questão."), 400

        results = []
        score = 0
        for question, answer in zip(questions, answers):
            correct = answer == question["answer"]
            score += int(correct)
            results.append({"id": question["id"], "correct": correct, "correct_answer": question["answer"], "explanation": question["explanation"]})

        percentage = round(score * 100 / len(questions))
        user = current_user()
        if user:
            db.session.add(QuizAttempt(user_id=user.id, module_slug=slug, score=score, total=len(questions)))
            progress = Progress.query.filter_by(user_id=user.id, module_slug=slug).first()
            if not progress:
                progress = Progress(user_id=user.id, module_slug=slug, best_score=0, completed=False)
                db.session.add(progress)
            progress.best_score = max(progress.best_score or 0, percentage)
            progress.completed = progress.completed or percentage >= 70
            db.session.commit()

        return jsonify(score=score, total=len(questions), percentage=percentage, passed=percentage >= 70, results=results, saved=bool(user))

    @app.post("/api/auth/register")
    def register():
        payload = request.get_json(silent=True) or {}
        name = str(payload.get("name", "")).strip()
        email = str(payload.get("email", "")).strip().lower()
        password = str(payload.get("password", ""))
        if len(name) < 2 or "@" not in email or len(password) < 6:
            return jsonify(error="Informe nome, e-mail válido e senha com ao menos 6 caracteres."), 400
        if User.query.filter_by(email=email).first():
            return jsonify(error="Este e-mail já está cadastrado."), 409
        user = User(name=name, email=email, password_hash=generate_password_hash(password))
        db.session.add(user)
        db.session.commit()
        session["user_id"] = user.id
        return jsonify(user=user.public()), 201

    @app.post("/api/auth/login")
    def login():
        payload = request.get_json(silent=True) or {}
        email = str(payload.get("email", "")).strip().lower()
        user = User.query.filter_by(email=email).first()
        if not user or not check_password_hash(user.password_hash, str(payload.get("password", ""))):
            return jsonify(error="E-mail ou senha inválidos."), 401
        session["user_id"] = user.id
        return jsonify(user=user.public())

    @app.post("/api/auth/logout")
    def logout():
        session.clear()
        return jsonify(ok=True)

    @app.get("/api/auth/me")
    def me():
        user = current_user()
        if not user:
            return jsonify(user=None)
        progress = Progress.query.filter_by(user_id=user.id).all()
        return jsonify(user=user.public(), progress=[item.public() for item in progress])

    @app.errorhandler(404)
    def not_found(_error):
        if request.path.startswith("/api/"):
            return jsonify(error="Recurso não encontrado."), 404
        return render_template("404.html"), 404

    def current_user():
        user_id = session.get("user_id")
        return db.session.get(User, user_id) if user_id else None

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)

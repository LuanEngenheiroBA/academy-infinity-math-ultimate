import pytest

from app import create_app, db


@pytest.fixture()
def client():
    app = create_app({
        "TESTING": True,
        "SECRET_KEY": "test-secret",
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
    })
    with app.app_context():
        db.create_all()
    return app.test_client()


def test_pages_render(client):
    assert client.get("/").status_code == 200
    assert client.get("/modulos").status_code == 200
    assert client.get("/modulos/modelagem-matematica").status_code == 200
    assert client.get("/quiz/modelagem-matematica").status_code == 200


def test_quiz_does_not_expose_answers(client):
    response = client.get("/api/quizzes/modelagem-matematica")
    assert response.status_code == 200
    assert "answer" not in response.get_json()["questions"][0]


def test_register_submit_and_save_progress(client):
    register = client.post("/api/auth/register", json={
        "name": "Pessoa Teste",
        "email": "teste@example.com",
        "password": "segredo123",
    })
    assert register.status_code == 201

    submitted = client.post("/api/quizzes/modelagem-matematica/submit", json={
        "answers": [1, 1, 1, 1, 1],
    })
    result = submitted.get_json()
    assert submitted.status_code == 200
    assert result["percentage"] == 100
    assert result["saved"] is True

    me = client.get("/api/auth/me").get_json()
    assert me["progress"][0]["completed"] is True
    assert me["progress"][0]["best_score"] == 100


def test_rejects_incomplete_quiz(client):
    response = client.post("/api/quizzes/conjuntos-logica/submit", json={"answers": [1]})
    assert response.status_code == 400

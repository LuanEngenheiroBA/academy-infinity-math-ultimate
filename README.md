Academia Matemática Infinita Suprema
Plataforma educacional de Modelagem e Simulação Matemática construída com Flask. Inclui trilha com cinco módulos, quizzes corrigidos no servidor, cadastro/login, persistência de progresso e páginas responsivas.

Funcionalidades
Cinco módulos, incluindo Modelagem Matemática Aplicada .
Páginas próprias para catálogo, conteúdo de cada módulo e cada quiz.
Quizzes com respostas mantidas no backend e aprovação a partir de 70%.
Cadastro e login com senha protegida por hash; conteúdos e APIs acadêmicas desativar sessão.
XP calculando pelo melhor resultado de cada módulo, com bônus de conclusão e proteção contra reprodução artificial.
Ofensiva baseada em dias consecutivos com atividade real de estudo.
Desbloqueio progressivo: o próximo módulo é liberado após a conclusão do anterior.
Painel do aluno com XP, nível, eficiência, progresso e histórico de esforço.
Simuladores de conjuntos, vetores, transformações, sequências e filas.
API JSON para módulos, quizzes, autenticação e progresso.
Executar localmente
Solicite Python 3.11 ou superior.

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
flask --app app run --debug
Abra http://127.0.0.1:5000.

Sem DATABASE_URL, o projeto usa SQLite localmente. Para usar as variáveis ​​do arquivo .env, exporte-as no shell ou utilize um carregador de ambiente.

Banco de dados na Vercel
Use PostgreSQL sem servidor . Neon é uma opção recomendada para ter conexão compatível com ambientes serverless e integração simples com Vercel. Supabase também funciona se for usada uma string PostgreSQL com SSL.

No painel da Vercel, configure:

DATABASE_URL: string de conexão PostgreSQL, incluindo sslmode=require.
SECRET_KEY: valor longo, aleatório e exclusivo do ambiente.
Não use SQLite no Vercel: o sistema de arquivos das funções é efêmero e não oferece persistência confiável entre execuções.

Implantar na Vercel
Importe este repositório para Vercel.
Crie ou conecte um banco Neon.
Cadastro DATABASE_URLe SECRET_KEYem Variáveis ​​de Ambiente.
Faça a implantação. O arquivo vercel.jsonjá direciona as rotas para o Flask.
As tabelas são criadas automaticamente na inicialização. Para uma evolução com múltiplos ambientes e alterações frequentes de esquema, adote Flask-Migrate/Alambic.

Rotas principais
/— experiência completa original.
/entrar— cadastro e login.
/painel— resumo pessoal de XP, ofensiva e progresso.
/modulose /modulos/<slug>— dicionário e aulas.
/quize /quiz/<slug>— catálogo e avaliação.
/api/health— diagnóstico da aplicação.
/api/auth/*— cadastro, login, sessão e logout.
/api/quizzes/<slug>— : sem gabarito.
/api/quizzes/<slug>/submit— correção e persistência.
Testes
pytest -q

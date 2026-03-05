import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from database import db, migrate

load_dotenv()

def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev_secret")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "sqlite:///database.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    CORS(app, origins=["http://127.0.0.1:5173"], supports_credentials=True)

    db.init_app(app)
    migrate.init_app(app, db)

    import models

    # Route-ok regisztrálása
    from routes import main_routes
    app.register_blueprint(main_routes.bp)
    from routes import auth_routes
    app.register_blueprint(auth_routes.bp)
    from routes import assessment_routes
    app.register_blueprint(assessment_routes.bp)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
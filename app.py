from flask import Flask, render_template

app = Flask(__name__)


@app.route("/")
@app.route("/voicecloner")
def home():
    return render_template("index.html")


@app.route("/upload")
def upload():
    return render_template("upload.html")


@app.route("/generate")
def generate():
    return render_template("generate.html")


@app.route("/profiles")
def profile():
    return render_template("profile.html")


if __name__ == "__main__":
    app.run(debug=True)
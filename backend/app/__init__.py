from flask import Flask
from .socket import socketio

app = Flask(__name__)

# Initialize the app with the socket instance
socketio.init_app(app)

# at the bottom of the file, use this to run the app
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)

@app.route('/')
def index():
    return "Server is running!"

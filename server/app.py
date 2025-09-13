from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return {'message': 'Hello from backend!'}

@app.route('/api/test')
def test():
    return {'status': 'Backend is working!'}

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
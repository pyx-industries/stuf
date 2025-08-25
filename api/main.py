from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "stuf-api"})

@app.route('/api/info', methods=['GET'])
def info():
    return jsonify({
        "name": "STUF API",
        "version": "0.1.0",
        "description": "Secure Transfer Upload Facility API"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)

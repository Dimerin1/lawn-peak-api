from flask import Flask, render_template, send_from_directory
from flask_cors import CORS
import os

# Load environment variables
# load_dotenv()

app = Flask(__name__, 
    static_folder='build/static',
    template_folder='build'
)
CORS(app)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

if __name__ == '__main__':
    port = int(os.getenv('PORT', 10000))
    app.run(host='0.0.0.0', port=port)

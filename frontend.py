from flask import Flask, render_template, send_from_directory, send_file
from flask_cors import CORS
import os

# Load environment variables
# load_dotenv()

app = Flask(__name__, 
    static_folder='build/static',
    template_folder='build'
)
CORS(app)

# Debug: Print current directory and contents
print("Current working directory:", os.getcwd())
print("Directory contents:", os.listdir())

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    print(f"Requested path: {path}")
    
    # First, try to serve from the root directory
    if path and os.path.exists(path):
        print(f"Serving file from root: {path}")
        return send_file(path)
    
    # Then, try to serve from the build directory
    build_path = os.path.join('build', path)
    if path and os.path.exists(build_path):
        print(f"Serving file from build: {build_path}")
        return send_file(build_path)
    
    # Finally, try to serve index.html
    index_path = os.path.join('build', 'index.html')
    if os.path.exists(index_path):
        print(f"Serving index.html")
        return send_file(index_path)
    
    print("No file found, returning 404")
    return "File not found", 404

@app.route('/admin')
def admin():
    return render_template('admin.html')

if __name__ == '__main__':
    port = int(os.getenv('PORT', 10000))
    app.run(host='0.0.0.0', port=port)

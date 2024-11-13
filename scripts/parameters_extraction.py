from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

BRIAN_API_KEY = "brian_p6b2MkYZt45MBakIF" 
BRIAN_API_URL = "https://api.brianknows.org/api/v0/agent/parameters-extraction"

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/extract', methods=['POST'])
def extract_parameters():
    data = request.json
    if not data or 'prompt' not in data:
        return jsonify({"error": "Invalid request. 'prompt' field is required."}), 400
    
    prompt = data['prompt']
    
    headers = {
        "Content-Type": "application/json",
        "x-brian-api-key": BRIAN_API_KEY,
    }
    
    payload = {
        "prompt": prompt
    }
    
    response = requests.post(BRIAN_API_URL, headers=headers, json=payload)
    
    if response.status_code == 200:
        result = response.json()
        # Parse parameters from result
        extracted_parameters = result.get("result", {}).get("completion", [])
        if not extracted_parameters:
            return jsonify({"prompt": prompt, "parameters": "No parameters extracted."})
        
        return jsonify({"prompt": prompt, "parameters": extracted_parameters})
    else:
        error = "Unable to get response from Brian's API."
        return jsonify({"prompt": prompt, "error": error}), response.status_code

if __name__ == '__main__':
    app.run(debug=True)

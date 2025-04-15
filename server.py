from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import json
import re

genai.configure(api_key='AIzaSyAuDJP-Iml0k2bi9RPA4DlDYD0s7M9aQuk')

app = Flask(__name__)
CORS(app)

@app.route('/process', methods=['POST'])
def process():
    data = request.json
    query = data.get('query')

    model = genai.GenerativeModel('gemini-1.5-pro')
    prompt = f"""
You are a developer assistant. Respond ONLY with a JSON object like:

{{
  "commands": [
    "echo 'Hello World' > test.txt"
  ],
  "files": [
    {{
      "filename": "app.py",
      "content": "from flask import Flask\\napp = Flask(__name__)\\n@app.route('/')\\ndef hello():\\n    return 'Hello World'\\nif __name__ == '__main__':\\n    app.run()"
    }}
  ]
}}

No explanations, no Markdown, no comments. Only raw JSON.

Query: "{query}"
"""

    try:
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        print("Raw Gemini response:\n", raw_text)

        if raw_text.startswith("```"):
            raw_text = re.sub(r"^```.*?\n", "", raw_text)
            raw_text = re.sub(r"\n```$", "", raw_text)

        data = json.loads(raw_text)
        return jsonify({
            "commands": data.get("commands", []),
            "files": data.get("files", [])
        })

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"commands": [], "files": [], "error": str(e)})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

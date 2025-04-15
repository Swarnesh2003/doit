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
    "echo 'hello world' > test.java"
  ]
}}

No explanations, no code blocks, no Markdown. Just raw JSON.

Now respond to this query: "{query}"
"""

    try:
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        print("Raw Gemini response:\n", raw_text)

        # Remove markdown-style code block if present
        if raw_text.startswith("```"):
            raw_text = re.sub(r"^```.*?\n", "", raw_text)  # remove starting ```
            raw_text = re.sub(r"\n```$", "", raw_text)     # remove ending ```

        # Parse JSON
        data = json.loads(raw_text)
        commands = data.get("commands", [])
        return jsonify({"commands": commands})
    except Exception as e:
        print("Exception while parsing Gemini response:", str(e))
        return jsonify({"commands": [], "error": str(e)})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

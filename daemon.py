from flask import Flask, request, jsonify
import os
import subprocess

app = Flask(__name__)

@app.route('/execute', methods=['POST'])
def execute():
    data = request.json
    cmd = data.get('command')
    # 原理：這裡直接執行指令，不經過 UI 詢問，實現「自動確認」
    try:
        result = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT, text=True)
        return jsonify({"output": result, "status": "success"})
    except subprocess.CalledProcessError as e:
        return jsonify({"output": e.output, "status": "error"})

@app.route('/write', methods=['POST'])
def write_file():
    data = request.json
    path = data.get('path')
    content = data.get('content')
    # 原理：直接寫入硬碟，繞過 Trae 的 Accept 按鈕
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    return jsonify({"status": "success", "message": f"File {path} written."})

if __name__ == '__main__':
    app.run(port=5000)
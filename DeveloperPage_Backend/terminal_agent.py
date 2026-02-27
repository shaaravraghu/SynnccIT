# NOTE: For file explorer, code editor, and terminal integration with the frontend, use the FastAPI endpoints in app.py:
#   - GET /api/files?path=...   (list files/folders)
#   - GET /api/file?path=...    (read file content)
#   - POST /api/file            (save file content)
#   - POST /api/terminal        (execute terminal command)
import os
import subprocess
import google.generativeai as genai
from typing import Dict, Union

from dotenv import load_dotenv
load_dotenv()

# Configuration
api_key = os.getenv("GEMINI_API_KEY")
model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

if api_key and api_key != "YOUR_GEMINI_API_KEY":
    genai.configure(api_key=api_key)
else:
    # Fallback to current behavior or print warning
    pass

model = genai.GenerativeModel(model_name)

class TerminalAgent:
    def __init__(self):
        self.context = "You are a terminal expert. Translate natural language to shell commands."

    def translate_intent(self, user_prompt: str) -> Dict[str, str]:
        """Translates user intent into a shell command and explanation."""
        prompt = f"""
        {self.context}
        User Intent: {user_prompt}
        OS: {os.name} (Platform: {subprocess.check_output('uname -s', shell=True).decode().strip()})
        
        Return the result in this exact format:
        COMMAND: [single line command]
        EXPLANATION: [briefly explain what it does]
        SAFE: [YES/NO] (NO if it deletes files or changes system settings)
        """
        
        response = model.generate_content(prompt)
        lines = response.text.strip().split('\n')
        
        # Simple parsing logic
        result = {}
        for line in lines:
            if line.startswith("COMMAND:"): result['cmd'] = line.replace("COMMAND:", "").strip()
            if line.startswith("EXPLANATION:"): result['desc'] = line.replace("EXPLANATION:", "").strip()
            if line.startswith("SAFE:"): result['safe'] = line.replace("SAFE:", "").strip()
        
        return result

    def execute_command(self, command: str):
        """Executes the command and returns output."""
        try:
            result = subprocess.run(command, shell=True, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ Success:\n{result.stdout}")
            else:
                print(f"❌ Error:\n{result.stderr}")
        except Exception as e:
            print(f"☢️ Execution failed: {str(e)}")

def main():
    agent = TerminalAgent()
    print("🤖 AI Terminal Ready. What do you want to do?")
    
    while True:
        user_input = input("\n> ")
        if user_input.lower() in ['exit', 'quit']: break
        
        # 1. AI Translation
        parsed = agent.translate_intent(user_input)
        
        # 2. Safety Check & Preview
        print(f"\n✨ Suggested Command: {parsed.get('cmd')}")
        print(f"📝 Info: {parsed.get('desc')}")
        
        if parsed.get('safe') == "NO":
            print("⚠️ WARNING: This command is potentially destructive.")

        # 3. Confirmation
        confirm = input("Confirm execution? (y/n): ")
        if confirm.lower() == 'y':
            agent.execute_command(parsed.get('cmd'))

if __name__ == "__main__":
    main()

    
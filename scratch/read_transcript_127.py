import json

def main():
    path = "/home/wavy/.gemini/antigravity-ide/brain/28247ddc-62ab-43d9-ac53-7cb54daa2875/.system_generated/logs/transcript.jsonl"
    with open(path) as f:
        for line in f:
            d = json.loads(line)
            idx = d.get("step_index")
            if idx == 127:
                print(f"=== STEP 127 ===")
                print(d.get("content"))
                break

if __name__ == "__main__":
    main()

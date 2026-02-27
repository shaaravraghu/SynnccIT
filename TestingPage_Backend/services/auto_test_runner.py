# from .testcase_generator import generate_testcases

def run_all_testcases(code: str):
    tcs = generate_testcases(code)

    passed = sum(1 for t in tcs if t["status"] == "PASS")
    failed = len(tcs) - passed

    return {
        "summary": {
            "total": len(tcs),
            "passed": passed,
            "failed": failed
        },
        "testcases": tcs
    }

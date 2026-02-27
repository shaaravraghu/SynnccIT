"""
coverage_analyzer.py — v2.0
Simple coverage tracking based on:
- total # of testcases run
- how many passed
"""

def analyze_coverage(code: str, language: str, trace, test_results):
    total = len(test_results)
    passed = sum(1 for t in test_results if t.get("passed"))

    coverage = 0
    if total > 0:
        coverage = int((passed / total) * 100)

    return {
        "summary": f"{coverage}% test coverage",
        "total_tests": total,
        "passed_tests": passed,
        "failed_tests": total - passed,
        "raw_trace": trace or [],
    }

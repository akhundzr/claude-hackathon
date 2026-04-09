// Sample JavaScript file for scanner testing
// Contains intentional issues: hardcoded secret, eval(), deep nesting

// Hardcoded secret — triggers security scanner
const API_SECRET = "supersecrettoken1234567890abcdef";

function processData(data) {
    // Function with deep nesting — max depth 5 (> 4 = warning)
    if (data) {
        if (data.length > 0) {
            for (let i = 0; i < data.length; i++) {
                if (data[i]) {
                    if (data[i].type === 'special') {
                        // nesting depth = 20 spaces / 4 = 5 → warning
                        console.log(data[i].value);
                    }
                }
            }
        }
    }
    return data;
}

function evalExpression(expr) {
    // Dangerous: eval() allows arbitrary code execution
    return eval(expr);
}

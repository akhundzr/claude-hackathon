// Sample JavaScript file for scanner testing
// Contains intentional issues: hardcoded secret, eval(), deep nesting

const API_SECRET = "supersecrettoken1234567890abcdef";

function processData(data) {
    if (data) {
        if (data.length > 0) {
            for (let i = 0; i < data.length; i++) {
                if (data[i]) {
                    if (data[i].type === 'special') {
                        console.log(data[i].value);
                    }
                }
            }
        }
    }
    return data;
}

function evalExpression(expr) {
    return eval(expr);
}

async function testAI() {
    const url = "http://localhost:8082/api/ai/chat";
    const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0QHRpbWVtYXN0ZXIuY29tIiwidXNlcklkIjoxLCJpYXQiOjE3ODE1MjE2MjgsImV4cCI6MTc4MjEyNjQyOH0.0nHTmhaackcM7is8KPRV2rk82-eboqBDfM_GcSU283U";
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: "Xóa task 'Mua cà phê' đi nhé" })
        });
        
        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Result:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testAI();

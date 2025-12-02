
async function testJimeng() {
    try {
        const apiKey = '00aa5e4efc337d005bc16c4a8ec4eac9'; // Test session ID
        const prompt = '生成一个完整的图片，中间文字标题是“测试竞赛”，其它部分请随意设计元素，不要有文字或文字图案！';

        console.log('Testing Jimeng API...');
        const res = await fetch('http://localhost:3000/quiz/api/ai/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey,
                prompt,
                test: false
            })
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text);

        if (res.ok) {
            console.log('Success! Image URL:', JSON.parse(text).imageUrl);
        }
    } catch (e) {
        console.error('Test failed:', e);
    }
}

testJimeng();

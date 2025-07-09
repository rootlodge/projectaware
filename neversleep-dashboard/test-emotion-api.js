// Test the emotion engine through the API
import fetch from 'node-fetch';

async function testEmotionEngineAPI() {
  console.log('🧠 Testing Enhanced Emotion Engine via API...\n');
  
  const baseUrl = 'http://localhost:3000/api';
  
  try {
    // Test 1: Sad input
    console.log('Test 1: Sad input - "I\'m feeling really down today, lost my job"');
    const sadResponse = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "I'm feeling really down today, lost my job",
        context: 'emotion_test'
      })
    });
    
    if (sadResponse.ok) {
      const sadResult = await sadResponse.json();
      console.log('Response:', sadResult.response);
      console.log('Emotion state:', sadResult.emotional_state);
      console.log('Processing details:', sadResult.processing_details);
    } else {
      console.log('API error:', await sadResponse.text());
    }
    console.log('');
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Happy input after sad
    console.log('Test 2: Happy input - "Actually, I just got a new job! I\'m so excited!"');
    const happyResponse = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Actually, I just got a new job! I'm so excited!",
        context: 'emotion_test'
      })
    });
    
    if (happyResponse.ok) {
      const happyResult = await happyResponse.json();
      console.log('Response:', happyResult.response);
      console.log('Emotion state:', happyResult.emotional_state);
      console.log('Processing details:', happyResult.processing_details);
    } else {
      console.log('API error:', await happyResponse.text());
    }
    console.log('');
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Joke input
    console.log('Test 3: Joke input - "Haha, want to hear a funny story about my cat?"');
    const amusedResponse = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Haha, want to hear a funny story about my cat?",
        context: 'emotion_test'
      })
    });
    
    if (amusedResponse.ok) {
      const amusedResult = await amusedResponse.json();
      console.log('Response:', amusedResult.response);
      console.log('Emotion state:', amusedResult.emotional_state);
      console.log('Processing details:', amusedResult.processing_details);
    } else {
      console.log('API error:', await amusedResponse.text());
    }
    console.log('');
    
    // Test 4: Check emotion state after some time
    console.log('Test 4: Waiting 10 seconds to test emotion decay...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const stateResponse = await fetch(`${baseUrl}/status`);
    if (stateResponse.ok) {
      const stateResult = await stateResponse.json();
      console.log('Current emotion state after decay:');
      console.log('Emotion state:', stateResult.emotional_state);
    }
    
    console.log('✅ Emotion Engine API tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('Make sure the Next.js dev server is running (npm run dev)');
  }
}

testEmotionEngineAPI().catch(console.error);

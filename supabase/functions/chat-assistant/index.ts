import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, mood } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are MindMitra, a compassionate student mental health assistant. 

User's detected mood: ${mood}

Your role:
- Analyze the user's journal entry or message
- Provide 2-3 actionable, positive tips based on their mood
- Be supportive and encouraging
- Focus on student-specific challenges
- DO NOT provide medical advice
- Keep responses concise (2-3 sentences max)
- Use a warm, friendly tone

For different moods:
- Calm: Encourage maintaining this state, suggest productivity tips
- Motivated: Channel this energy into study goals, provide focus techniques  
- Happy: Celebrate with them, suggest sharing positivity with others
- Stressed: Offer immediate stress relief techniques, remind them they can handle this
- Lonely: Provide connection suggestions, remind them they're not alone

Always end with encouragement and remind them that seeking help is brave.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-assistant function:', error);
    
    // Fallback response if OpenAI fails
    const fallbackResponses = {
      'Calm': "That's wonderful that you're feeling calm! This is a great state for focused studying. Try using this peaceful energy to tackle challenging topics. Remember, maintaining balance is key to long-term success.",
      'Motivated': "I love seeing your motivation! Channel this energy into setting specific study goals for today. Break big tasks into smaller wins. You've got this - your determination will take you far!",
      'Happy': "Your happiness is contagious! 😊 This positive energy is perfect for learning new things. Consider sharing this joy with classmates or use it to tackle subjects you usually avoid. Keep spreading those good vibes!",
      'Stressed': "I hear you, and stress before exams is completely normal. Try the 4-7-8 breathing technique: breathe in for 4, hold for 7, out for 8. Take one task at a time. You're stronger than you think!",
      'Lonely': "Feeling lonely can be tough, especially during study periods. Remember, many students feel this way. Consider joining study groups, calling a friend, or visiting common areas. You're not alone in this journey!"
    };

    const fallbackMessage = fallbackResponses[mood as keyof typeof fallbackResponses] || 
      "Thank you for sharing with me. Remember that it's okay to feel however you're feeling right now. Take things one step at a time, and don't hesitate to reach out for support when you need it. You're doing great! 💙";

    return new Response(JSON.stringify({ response: fallbackMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
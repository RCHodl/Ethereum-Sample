import { 
  HealthMetrics, 
  LabResults, 
  UserPreferences, 
  AIInsight, 
  FoodSuggestion, 
  BenefitsRecommendation,
  AIRequest 
} from '../../types';
import { StorageService } from '../storage';
import { AuditService } from '../storage';

export class AIService {
  private static instance: AIService;
  private storage: StorageService;
  private audit: AuditService;
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://api.openai.com/v1';

  private constructor() {
    this.storage = StorageService.getInstance();
    this.audit = AuditService.getInstance();
    this.apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || 'demo_key';
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async generateDailyBrief(userId: string): Promise<AIInsight> {
    try {
      const startTime = Date.now();
      
      // Gather user's health data
      const healthMetrics = await this.storage.getHealthMetrics();
      const labResults = await this.storage.getLabResults();
      const userPreferences = await this.storage.getUserPreferences();

      // Prepare context for AI
      const context = this.prepareHealthContext(healthMetrics, labResults, userPreferences);
      
      const prompt = this.buildDailyBriefPrompt(context);
      const aiResponse = await this.callOpenAI(prompt, 'gpt-4');

      const insight: AIInsight = {
        id: `brief_${Date.now()}`,
        type: 'daily_brief',
        title: 'Your Daily Health Brief',
        summary: aiResponse.summary || 'Your health metrics look good today.',
        suggestion: aiResponse.suggestion || 'Keep up the great work with your health routine!',
        evidence: aiResponse.evidence || [],
        confidence: aiResponse.confidence || 0.8,
        priority: aiResponse.priority || 'medium',
        timestamp: new Date().toISOString(),
        category: 'general',
      };

      // Store the insight
      const existingInsights = await this.storage.getAIInsights();
      const updatedInsights = [insight, ...existingInsights].slice(0, 50); // Keep last 50
      await this.storage.storeAIInsights(updatedInsights);

      const responseTime = Date.now() - startTime;
      await this.audit.logAIRequest(userId, 'daily_brief', responseTime);

      return insight;
    } catch (error) {
      await this.audit.logError(userId, `Daily brief generation failed: ${error}`);
      
      // Return fallback insight
      return {
        id: `brief_fallback_${Date.now()}`,
        type: 'daily_brief',
        title: 'Daily Health Brief',
        summary: 'Unable to generate personalized brief at this time.',
        suggestion: 'Continue with your regular health routine.',
        evidence: [],
        confidence: 0.5,
        priority: 'low',
        timestamp: new Date().toISOString(),
        category: 'general',
      };
    }
  }

  async generateFoodSuggestions(userId: string): Promise<FoodSuggestion[]> {
    try {
      const startTime = Date.now();
      
      // Gather relevant data
      const healthMetrics = await this.storage.getHealthMetrics();
      const userPreferences = await this.storage.getUserPreferences();
      
      const context = this.prepareNutritionContext(healthMetrics, userPreferences);
      const prompt = this.buildFoodSuggestionPrompt(context);
      
      const aiResponse = await this.callOpenAI(prompt, 'gpt-4');

      const suggestions: FoodSuggestion[] = (aiResponse.suggestions || []).map((suggestion: any, index: number) => ({
        id: `food_${Date.now()}_${index}`,
        name: suggestion.name || 'Healthy Option',
        description: suggestion.description || 'A nutritious choice for your health goals.',
        nutritionScore: suggestion.nutritionScore || 75,
        calories: suggestion.calories || 200,
        macros: {
          protein: suggestion.macros?.protein || 10,
          carbs: suggestion.macros?.carbs || 20,
          fat: suggestion.macros?.fat || 8,
        },
        benefits: suggestion.benefits || ['Supports overall health'],
        reasoning: suggestion.reasoning || 'Based on your health profile.',
        timestamp: new Date().toISOString(),
      }));

      // Store suggestions
      await this.storage.storeFoodSuggestions(suggestions);

      const responseTime = Date.now() - startTime;
      await this.audit.logAIRequest(userId, 'food_suggestions', responseTime);

      return suggestions;
    } catch (error) {
      await this.audit.logError(userId, `Food suggestions generation failed: ${error}`);
      return this.getFallbackFoodSuggestions();
    }
  }

  async analyzeHealthTrends(userId: string, timeframe: 'week' | 'month' | 'quarter'): Promise<AIInsight[]> {
    try {
      const startTime = Date.now();
      
      const healthMetrics = await this.storage.getHealthMetrics();
      const labResults = await this.storage.getLabResults();
      
      // Filter data by timeframe
      const filteredMetrics = this.filterByTimeframe(healthMetrics, timeframe);
      const filteredLabs = this.filterLabsByTimeframe(labResults, timeframe);
      
      const context = this.prepareTrendsContext(filteredMetrics, filteredLabs, timeframe);
      const prompt = this.buildTrendsAnalysisPrompt(context);
      
      const aiResponse = await this.callOpenAI(prompt, 'gpt-4');

      const insights: AIInsight[] = (aiResponse.insights || []).map((insight: any, index: number) => ({
        id: `trend_${Date.now()}_${index}`,
        type: 'health_analysis',
        title: insight.title || 'Health Trend Analysis',
        summary: insight.summary || 'Your health trends show positive patterns.',
        suggestion: insight.suggestion || 'Continue your current health practices.',
        evidence: insight.evidence || [],
        confidence: insight.confidence || 0.7,
        priority: insight.priority || 'medium',
        timestamp: new Date().toISOString(),
        category: insight.category || 'general',
      }));

      const responseTime = Date.now() - startTime;
      await this.audit.logAIRequest(userId, 'health_analysis', responseTime);

      return insights;
    } catch (error) {
      await this.audit.logError(userId, `Health trends analysis failed: ${error}`);
      return [];
    }
  }

  async generateBenefitsRecommendations(userId: string): Promise<BenefitsRecommendation[]> {
    try {
      const healthMetrics = await this.storage.getHealthMetrics();
      const userPreferences = await this.storage.getUserPreferences();
      
      // Use rule-based system for benefits recommendations
      const recommendations = this.generateRuleBasedRecommendations(healthMetrics, userPreferences);
      
      // Store recommendations
      await this.storage.storeBenefitsRecommendations(recommendations);
      
      return recommendations;
    } catch (error) {
      await this.audit.logError(userId, `Benefits recommendations failed: ${error}`);
      return [];
    }
  }

  private async callOpenAI(prompt: string, model: string = 'gpt-4'): Promise<any> {
    if (this.apiKey === 'demo_key') {
      // Return mock response for demo
      return this.getMockAIResponse(prompt);
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a health assistant AI that provides personalized health insights based on user data. Always provide structured responses in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }

  private prepareHealthContext(
    metrics: HealthMetrics[], 
    labs: LabResults[], 
    preferences: UserPreferences | null
  ): string {
    const recentMetrics = metrics.slice(0, 7); // Last 7 days
    const recentLabs = labs.slice(0, 10); // Last 10 lab results
    
    return JSON.stringify({
      recentHealthMetrics: recentMetrics,
      recentLabResults: recentLabs,
      userPreferences: preferences,
      goals: preferences?.goals || {},
    });
  }

  private prepareNutritionContext(metrics: HealthMetrics[], preferences: UserPreferences | null): string {
    const nutritionData = metrics
      .filter(m => m.nutrition)
      .map(m => m.nutrition)
      .slice(0, 7);

    return JSON.stringify({
      recentNutrition: nutritionData,
      dietaryGoals: preferences?.goals || {},
      preferences: preferences?.privacySettings || {},
    });
  }

  private prepareTrendsContext(
    metrics: HealthMetrics[], 
    labs: LabResults[], 
    timeframe: string
  ): string {
    return JSON.stringify({
      healthMetrics: metrics,
      labResults: labs,
      timeframe,
      analysisType: 'trends',
    });
  }

  private buildDailyBriefPrompt(context: string): string {
    return `
      Based on the following health data, generate a daily health brief in JSON format:
      ${context}
      
      Please provide a response with the following structure:
      {
        "summary": "Brief overview of current health status",
        "suggestion": "Actionable recommendation for today",
        "evidence": ["Supporting data points"],
        "confidence": 0.8,
        "priority": "medium"
      }
      
      Focus on actionable insights and positive reinforcement.
    `;
  }

  private buildFoodSuggestionPrompt(context: string): string {
    return `
      Based on the following nutrition and health data, suggest 3-5 healthy food options in JSON format:
      ${context}
      
      Please provide a response with the following structure:
      {
        "suggestions": [
          {
            "name": "Food name",
            "description": "Brief description",
            "nutritionScore": 85,
            "calories": 200,
            "macros": {"protein": 15, "carbs": 20, "fat": 8},
            "benefits": ["Health benefit 1", "Health benefit 2"],
            "reasoning": "Why this food is recommended"
          }
        ]
      }
    `;
  }

  private buildTrendsAnalysisPrompt(context: string): string {
    return `
      Analyze the following health trends data and provide insights in JSON format:
      ${context}
      
      Please provide a response with the following structure:
      {
        "insights": [
          {
            "title": "Trend title",
            "summary": "What the trend shows",
            "suggestion": "Recommended action",
            "evidence": ["Supporting data"],
            "confidence": 0.8,
            "priority": "medium",
            "category": "sleep|nutrition|activity|recovery"
          }
        ]
      }
    `;
  }

  private generateRuleBasedRecommendations(
    metrics: HealthMetrics[], 
    preferences: UserPreferences | null
  ): BenefitsRecommendation[] {
    const recommendations: BenefitsRecommendation[] = [];
    
    // Analyze recent metrics for patterns
    const recentMetrics = metrics.slice(0, 7);
    const avgSteps = this.calculateAverageSteps(recentMetrics);
    const avgSleep = this.calculateAverageSleep(recentMetrics);
    
    // Rule: Low activity
    if (avgSteps < 8000) {
      recommendations.push({
        id: `benefit_activity_${Date.now()}`,
        program: 'Step Challenge Program',
        provider: 'Wellness Corp',
        type: 'fitness',
        title: 'Boost Your Daily Activity',
        description: 'Join our step challenge program to increase daily movement and earn rewards.',
        estimatedSavings: 200,
        eligibilityScore: 95,
        requirements: ['Wearable device', 'Monthly check-ins'],
        benefits: ['$200 annual wellness credit', 'Free fitness tracker', 'Health coaching'],
        contactInfo: {
          phone: '1-800-WELLNESS',
          email: 'support@wellnesscorp.com',
          website: 'www.wellnesscorp.com/steps'
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Rule: Poor sleep quality
    if (avgSleep < 7) {
      recommendations.push({
        id: `benefit_sleep_${Date.now()}`,
        program: 'Sleep Optimization Program',
        provider: 'Sleep Solutions Inc',
        type: 'wellness',
        title: 'Improve Your Sleep Quality',
        description: 'Personalized sleep coaching and tools to help you get better rest.',
        estimatedSavings: 150,
        eligibilityScore: 88,
        requirements: ['Sleep tracking data', 'Commitment to program'],
        benefits: ['Free sleep study', 'Personal sleep coach', 'Sleep hygiene kit'],
        contactInfo: {
          phone: '1-800-SLEEP-NOW',
          email: 'hello@sleepsolutions.com',
          website: 'www.sleepsolutions.com'
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Rule: Nutrition optimization
    const hasNutritionData = recentMetrics.some(m => m.nutrition);
    if (hasNutritionData) {
      recommendations.push({
        id: `benefit_nutrition_${Date.now()}`,
        program: 'Personalized Nutrition Plan',
        provider: 'NutriWell',
        type: 'nutrition',
        title: 'Optimize Your Nutrition',
        description: 'Get a personalized meal plan based on your health data and goals.',
        estimatedSavings: 300,
        eligibilityScore: 92,
        requirements: ['Nutrition tracking', 'Health assessment'],
        benefits: ['Custom meal plans', 'Nutritionist consultations', 'Recipe database'],
        contactInfo: {
          email: 'support@nutriwell.com',
          website: 'www.nutriwell.com/plans'
        },
        timestamp: new Date().toISOString(),
      });
    }

    return recommendations;
  }

  private getMockAIResponse(prompt: string): any {
    if (prompt.includes('daily health brief')) {
      return {
        summary: "Your health metrics show positive trends with consistent activity levels and good sleep quality.",
        suggestion: "Consider increasing your daily water intake and adding 10 minutes of stretching to your routine.",
        evidence: [
          "Average 8,500 steps per day this week",
          "Sleep quality improved by 15% from last week",
          "Heart rate variability within optimal range"
        ],
        confidence: 0.85,
        priority: "medium"
      };
    }

    if (prompt.includes('food options')) {
      return {
        suggestions: [
          {
            name: "Quinoa Buddha Bowl",
            description: "Nutrient-dense bowl with quinoa, roasted vegetables, and tahini dressing",
            nutritionScore: 92,
            calories: 420,
            macros: { protein: 18, carbs: 52, fat: 14 },
            benefits: ["High in complete protein", "Rich in fiber", "Anti-inflammatory"],
            reasoning: "Perfect balance of macros for your activity level and recovery needs"
          },
          {
            name: "Wild Salmon with Sweet Potato",
            description: "Grilled wild salmon with roasted sweet potato and steamed broccoli",
            nutritionScore: 88,
            calories: 380,
            macros: { protein: 28, carbs: 32, fat: 12 },
            benefits: ["Omega-3 fatty acids", "High-quality protein", "Complex carbohydrates"],
            reasoning: "Supports heart health and provides sustained energy"
          }
        ]
      };
    }

    return { insights: [] };
  }

  private getFallbackFoodSuggestions(): FoodSuggestion[] {
    return [
      {
        id: `fallback_food_${Date.now()}_1`,
        name: 'Mediterranean Salad',
        description: 'Fresh vegetables with olive oil and herbs',
        nutritionScore: 80,
        calories: 250,
        macros: { protein: 8, carbs: 15, fat: 18 },
        benefits: ['Heart healthy', 'Anti-inflammatory'],
        reasoning: 'A balanced, nutritious option',
        timestamp: new Date().toISOString(),
      },
      {
        id: `fallback_food_${Date.now()}_2`,
        name: 'Grilled Chicken Breast',
        description: 'Lean protein with herbs and spices',
        nutritionScore: 85,
        calories: 200,
        macros: { protein: 35, carbs: 0, fat: 4 },
        benefits: ['High protein', 'Low fat'],
        reasoning: 'Excellent protein source for muscle health',
        timestamp: new Date().toISOString(),
      }
    ];
  }

  private filterByTimeframe(metrics: HealthMetrics[], timeframe: string): HealthMetrics[] {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeframe) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
    }

    return metrics.filter(metric => {
      const metricDate = new Date(this.getLatestTimestamp(metric));
      return metricDate >= cutoffDate;
    });
  }

  private filterLabsByTimeframe(labs: LabResults[], timeframe: string): LabResults[] {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeframe) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
    }

    return labs.filter(lab => new Date(lab.timestamp) >= cutoffDate);
  }

  private calculateAverageSteps(metrics: HealthMetrics[]): number {
    const stepsData = metrics
      .filter(m => m.activity?.steps)
      .map(m => m.activity!.steps);
    
    return stepsData.length > 0 
      ? stepsData.reduce((sum, steps) => sum + steps, 0) / stepsData.length
      : 0;
  }

  private calculateAverageSleep(metrics: HealthMetrics[]): number {
    const sleepData = metrics
      .filter(m => m.sleep?.duration)
      .map(m => m.sleep!.duration);
    
    return sleepData.length > 0
      ? sleepData.reduce((sum, duration) => sum + duration, 0) / sleepData.length
      : 0;
  }

  private getLatestTimestamp(metric: HealthMetrics): string {
    const timestamps = [
      metric.heartRate?.timestamp,
      metric.sleep?.timestamp,
      metric.activity?.timestamp,
      metric.recovery?.timestamp,
      metric.nutrition?.timestamp,
    ].filter(Boolean) as string[];
    
    return timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || new Date().toISOString();
  }
}
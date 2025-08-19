import { 
  DemoData, 
  HealthMetrics, 
  LabResults, 
  AIInsight, 
  FoodSuggestion, 
  BenefitsRecommendation,
  UserPreferences 
} from '../types';
import { StorageService } from './storage';

export class DemoService {
  private static instance: DemoService;
  private storage: StorageService;

  private constructor() {
    this.storage = StorageService.getInstance();
  }

  public static getInstance(): DemoService {
    if (!DemoService.instance) {
      DemoService.instance = new DemoService();
    }
    return DemoService.instance;
  }

  async enableDemoMode(): Promise<void> {
    await this.storage.setDemoMode(true);
    await this.loadDemoData();
  }

  async disableDemoMode(): Promise<void> {
    await this.storage.setDemoMode(false);
    await this.clearDemoData();
  }

  async isDemoMode(): Promise<boolean> {
    return await this.storage.isDemoMode();
  }

  private async loadDemoData(): Promise<void> {
    const demoData = this.generateDemoData();
    
    // Store all demo data
    await this.storage.storeHealthMetrics(demoData.healthMetrics);
    await this.storage.storeLabResults(demoData.labResults);
    await this.storage.storeAIInsights(demoData.aiInsights);
    await this.storage.storeFoodSuggestions(demoData.foodSuggestions);
    await this.storage.storeBenefitsRecommendations(demoData.benefitsRecommendations);
    
    // Store demo user preferences
    const demoPreferences = this.generateDemoPreferences();
    await this.storage.storeUserPreferences(demoPreferences);
  }

  private async clearDemoData(): Promise<void> {
    // Clear all demo data but keep the structure
    await this.storage.storeHealthMetrics([]);
    await this.storage.storeLabResults([]);
    await this.storage.storeAIInsights([]);
    await this.storage.storeFoodSuggestions([]);
    await this.storage.storeBenefitsRecommendations([]);
  }

  private generateDemoData(): DemoData {
    return {
      healthMetrics: this.generateDemoHealthMetrics(),
      labResults: this.generateDemoLabResults(),
      aiInsights: this.generateDemoAIInsights(),
      foodSuggestions: this.generateDemoFoodSuggestions(),
      benefitsRecommendations: this.generateDemoBenefitsRecommendations(),
    };
  }

  private generateDemoHealthMetrics(): HealthMetrics[] {
    const metrics: HealthMetrics[] = [];
    const today = new Date();

    // Generate 30 days of demo data
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const timestamp = date.toISOString();

      // Simulate realistic variations
      const baseSteps = 8500;
      const stepVariation = Math.random() * 3000 - 1500; // ±1500 steps
      const steps = Math.max(3000, Math.round(baseSteps + stepVariation));

      const baseSleep = 7.5;
      const sleepVariation = Math.random() * 2 - 1; // ±1 hour
      const sleepDuration = Math.max(5, baseSleep + sleepVariation);

      const baseRHR = 65;
      const rhrVariation = Math.random() * 10 - 5; // ±5 bpm
      const restingHR = Math.max(50, Math.round(baseRHR + rhrVariation));

      const metric: HealthMetrics = {
        heartRate: {
          resting: restingHR,
          max: restingHR + 120 + Math.round(Math.random() * 20),
          average: restingHR + 20 + Math.round(Math.random() * 15),
          timestamp,
        },
        sleep: {
          duration: sleepDuration,
          quality: this.getSleepQuality(sleepDuration),
          deepSleep: sleepDuration * (0.15 + Math.random() * 0.1), // 15-25% deep sleep
          remSleep: sleepDuration * (0.20 + Math.random() * 0.1), // 20-30% REM sleep
          timestamp,
        },
        activity: {
          steps,
          distance: steps / 2000, // Rough conversion
          caloriesBurned: Math.round(steps * 0.04 + 200 + Math.random() * 100),
          activeMinutes: Math.round(steps / 150 + Math.random() * 20),
          timestamp,
        },
        recovery: {
          score: Math.round(60 + Math.random() * 35), // 60-95 recovery score
          strain: Math.round(8 + Math.random() * 10), // 8-18 strain
          hrv: Math.round(25 + Math.random() * 50), // 25-75 HRV
          timestamp,
        },
        nutrition: i < 7 ? { // Only last week has nutrition data
          calories: Math.round(1800 + Math.random() * 600),
          protein: Math.round(80 + Math.random() * 40),
          carbs: Math.round(200 + Math.random() * 100),
          fat: Math.round(60 + Math.random() * 30),
          fiber: Math.round(20 + Math.random() * 15),
          sugar: Math.round(40 + Math.random() * 30),
          sodium: Math.round(2000 + Math.random() * 1000),
          timestamp,
        } : undefined,
      };

      metrics.push(metric);
    }

    return metrics;
  }

  private generateDemoLabResults(): LabResults[] {
    const results: LabResults[] = [];
    const today = new Date();

    // Generate some realistic lab results
    const labTests = [
      { name: 'Total Cholesterol', value: 185, unit: 'mg/dL', min: 0, max: 200 },
      { name: 'HDL Cholesterol', value: 58, unit: 'mg/dL', min: 40, max: 100 },
      { name: 'LDL Cholesterol', value: 115, unit: 'mg/dL', min: 0, max: 130 },
      { name: 'Triglycerides', value: 95, unit: 'mg/dL', min: 0, max: 150 },
      { name: 'Glucose (Fasting)', value: 88, unit: 'mg/dL', min: 70, max: 100 },
      { name: 'HbA1c', value: 5.2, unit: '%', min: 4.0, max: 5.6 },
      { name: 'Vitamin D', value: 32, unit: 'ng/mL', min: 30, max: 100 },
      { name: 'Vitamin B12', value: 450, unit: 'pg/mL', min: 300, max: 900 },
      { name: 'TSH', value: 2.1, unit: 'mIU/L', min: 0.4, max: 4.0 },
      { name: 'CRP', value: 0.8, unit: 'mg/L', min: 0, max: 3.0 },
    ];

    labTests.forEach((test, index) => {
      const date = new Date(today);
      date.setMonth(today.getMonth() - Math.floor(index / 3)); // Spread over last few months
      
      const result: LabResults = {
        id: `lab_demo_${index}`,
        testName: test.name,
        value: test.value + (Math.random() * 10 - 5), // Add some variation
        unit: test.unit,
        referenceRange: {
          min: test.min,
          max: test.max,
        },
        status: this.getLabStatus(test.value, test.min, test.max),
        timestamp: date.toISOString(),
        category: 'blood',
      };

      results.push(result);
    });

    return results;
  }

  private generateDemoAIInsights(): AIInsight[] {
    return [
      {
        id: 'demo_insight_1',
        type: 'daily_brief',
        title: 'Your Daily Health Brief',
        summary: 'Your health metrics show excellent progress this week with consistent sleep patterns and strong activity levels.',
        suggestion: 'Consider adding 5 minutes of meditation to your morning routine to further enhance your recovery scores.',
        evidence: [
          'Sleep quality improved 18% from last week',
          'Average 9,200 steps daily - exceeding your goal',
          'Heart rate variability in optimal range (45ms)',
          'Recovery score averaging 82/100'
        ],
        confidence: 0.89,
        priority: 'medium',
        timestamp: new Date().toISOString(),
        category: 'general',
      },
      {
        id: 'demo_insight_2',
        type: 'wellness_tip',
        title: 'Hydration Optimization',
        summary: 'Your activity levels suggest you may need increased hydration, especially on high-activity days.',
        suggestion: 'Aim for an additional 16oz of water on days when you exceed 10,000 steps.',
        evidence: [
          'Heart rate slightly elevated during afternoon workouts',
          'Recovery scores dip on high-activity days',
          'Optimal hydration supports better sleep quality'
        ],
        confidence: 0.75,
        priority: 'low',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        category: 'activity',
      },
      {
        id: 'demo_insight_3',
        type: 'alert',
        title: 'Sleep Pattern Notice',
        summary: 'Your bedtime has been inconsistent over the past week, which may impact recovery.',
        suggestion: 'Try to maintain a consistent bedtime within a 30-minute window for optimal sleep quality.',
        evidence: [
          'Bedtime variance of 75 minutes this week',
          'Sleep onset time increased on irregular nights',
          'Deep sleep percentage lower on late nights'
        ],
        confidence: 0.82,
        priority: 'high',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'sleep',
      }
    ];
  }

  private generateDemoFoodSuggestions(): FoodSuggestion[] {
    return [
      {
        id: 'demo_food_1',
        name: 'Quinoa Power Bowl',
        description: 'Nutrient-dense bowl with quinoa, roasted vegetables, avocado, and tahini dressing',
        nutritionScore: 94,
        calories: 485,
        macros: {
          protein: 18,
          carbs: 58,
          fat: 16,
        },
        benefits: [
          'Complete protein source',
          'High in fiber and minerals',
          'Anti-inflammatory ingredients',
          'Sustained energy release'
        ],
        reasoning: 'Perfect post-workout meal based on your recent training intensity. The quinoa provides complete amino acids for recovery, while the vegetables offer antioxidants to reduce exercise-induced inflammation.',
        imageUrl: 'https://example.com/quinoa-bowl.jpg',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'demo_food_2',
        name: 'Wild Salmon with Sweet Potato',
        description: 'Grilled wild-caught salmon with roasted sweet potato and steamed broccoli',
        nutritionScore: 91,
        calories: 420,
        macros: {
          protein: 32,
          carbs: 35,
          fat: 14,
        },
        benefits: [
          'Omega-3 fatty acids for heart health',
          'High-quality protein',
          'Complex carbohydrates',
          'Rich in vitamin A and C'
        ],
        reasoning: 'Excellent choice for heart health based on your recent cholesterol panel. The omega-3s in salmon can help improve your HDL levels, while sweet potato provides sustained energy.',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'demo_food_3',
        name: 'Greek Yogurt Berry Parfait',
        description: 'Plain Greek yogurt layered with mixed berries, nuts, and a drizzle of honey',
        nutritionScore: 87,
        calories: 280,
        macros: {
          protein: 20,
          carbs: 28,
          fat: 8,
        },
        benefits: [
          'Probiotics for gut health',
          'Antioxidants from berries',
          'Calcium for bone health',
          'Quick energy from natural sugars'
        ],
        reasoning: 'Great pre-workout snack that aligns with your morning exercise routine. The protein will help maintain muscle mass while the berries provide quick energy.',
        timestamp: new Date().toISOString(),
      }
    ];
  }

  private generateDemoBenefitsRecommendations(): BenefitsRecommendation[] {
    return [
      {
        id: 'demo_benefit_1',
        program: 'Active Lifestyle Rewards',
        provider: 'HealthFirst Insurance',
        type: 'wellness',
        title: 'Earn Rewards for Your Active Lifestyle',
        description: 'Get up to $300 annually in wellness rewards for maintaining consistent activity levels and health metrics.',
        estimatedSavings: 300,
        eligibilityScore: 96,
        requirements: [
          'Maintain 8,000+ daily steps for 6 months',
          'Complete annual health assessment',
          'Sync wearable device data monthly'
        ],
        benefits: [
          '$25 monthly wellness credit',
          'Free annual fitness tracker upgrade',
          'Discounted gym memberships',
          'Health coaching sessions'
        ],
        contactInfo: {
          phone: '1-800-HEALTH-1',
          email: 'wellness@healthfirst.com',
          website: 'www.healthfirst.com/wellness-rewards'
        },
        timestamp: new Date().toISOString(),
      },
      {
        id: 'demo_benefit_2',
        program: 'Preventive Care Plus',
        provider: 'WellCare Solutions',
        type: 'preventive',
        title: 'Enhanced Preventive Care Coverage',
        description: 'Qualify for enhanced preventive care benefits based on your excellent health metrics and proactive health management.',
        estimatedSavings: 500,
        eligibilityScore: 88,
        requirements: [
          'Consistent health metric tracking',
          'Annual lab work completion',
          'No major health incidents in past 2 years'
        ],
        benefits: [
          'Free advanced health screenings',
          '$0 copay for preventive visits',
          'Nutritionist consultations covered',
          'Mental health wellness sessions'
        ],
        contactInfo: {
          phone: '1-855-WELLCARE',
          email: 'benefits@wellcaresolutions.com',
          website: 'www.wellcaresolutions.com/preventive-plus'
        },
        timestamp: new Date().toISOString(),
      },
      {
        id: 'demo_benefit_3',
        program: 'Sleep Optimization Program',
        provider: 'RestWell Institute',
        type: 'wellness',
        title: 'Optimize Your Sleep for Better Health',
        description: 'Based on your sleep data, you qualify for our comprehensive sleep optimization program with personalized coaching.',
        estimatedSavings: 200,
        eligibilityScore: 75,
        requirements: [
          'Sleep tracking data for 30+ days',
          'Completion of sleep assessment',
          'Commitment to 12-week program'
        ],
        benefits: [
          'Personal sleep coach',
          'Sleep hygiene optimization kit',
          'Monthly progress reviews',
          'Access to sleep improvement app'
        ],
        contactInfo: {
          phone: '1-800-REST-WELL',
          email: 'sleep@restwell.com',
          website: 'www.restwell.com/sleep-program'
        },
        timestamp: new Date().toISOString(),
      }
    ];
  }

  private generateDemoPreferences(): UserPreferences {
    return {
      consentScope: 'wellness_only',
      dataRetention: 365, // 1 year
      notifications: {
        dailyBrief: true,
        foodSuggestions: true,
        benefitsUpdates: true,
        healthAlerts: true,
      },
      privacySettings: {
        shareWithProviders: false,
        anonymousAnalytics: true,
        marketingCommunications: false,
      },
      goals: {
        weight: 160,
        steps: 10000,
        sleep: 8,
        calories: 2000,
      },
    };
  }

  private getSleepQuality(duration: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (duration >= 8) return 'excellent';
    if (duration >= 7) return 'good';
    if (duration >= 6) return 'fair';
    return 'poor';
  }

  private getLabStatus(value: number, min: number, max: number): 'low' | 'normal' | 'high' {
    if (value < min) return 'low';
    if (value > max) return 'high';
    return 'normal';
  }

  // Method to get demo status message for UI
  getDemoStatusMessage(): string {
    return "🎭 Demo Mode Active - You're viewing sample health data for presentation purposes. Connect your real health apps to see your actual data.";
  }

  // Method to generate demo notification
  getDemoNotification(): { title: string; message: string } {
    return {
      title: "Demo Mode",
      message: "This app is running in demo mode with sample data. Your privacy is protected."
    };
  }
}
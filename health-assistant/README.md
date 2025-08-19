# AI-Powered Health Assistant

A comprehensive React Native mobile app that acts as an AI-powered health assistant, integrating data from wearables, nutrition apps, and manual uploads to provide personalized health insights and benefits recommendations.

## 🌟 Features

### Core Functionality
- **AI Daily Health Brief**: GPT-powered daily summaries with personalized recommendations
- **Smart Food Suggestions**: AI-generated meal recommendations based on health data
- **Benefits Router**: Rules-based wellness program recommendations
- **Multi-Source Data Integration**: WHOOP, Apple Health, Strava, Cronometer support
- **Manual Data Upload**: CSV/PDF support for lab results and health metrics

### Privacy & Security
- **Granular Consent Management**: Choose between wellness-only vs underwriting data usage
- **Local Storage**: Data stored securely on device with optional cloud sync
- **Comprehensive Audit Logging**: Track all data access and user actions
- **HIPAA-Compliant Architecture**: Built with healthcare privacy standards in mind

### User Experience
- **Demo Mode**: Preloaded sample data for presentations and testing
- **Offline Capability**: Full functionality without internet connection
- **Intuitive Navigation**: Clean, healthcare-focused UI design
- **Real-time Sync**: Automatic data synchronization from connected sources

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **Storage**: AsyncStorage + Expo SecureStore
- **Authentication**: OAuth 2.0 with PKCE
- **AI Integration**: OpenAI GPT-4 API
- **Charts**: React Native Chart Kit

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components
│   ├── home/           # Home screen components
│   ├── benefits/       # Benefits screen components
│   ├── settings/       # Settings screen components
│   └── charts/         # Data visualization components
├── screens/            # Main application screens
│   ├── Home/           # Health dashboard
│   ├── Benefits/       # Benefits recommendations
│   └── Settings/       # App configuration
├── services/           # Business logic layer
│   ├── ai/             # AI/ML integration
│   ├── auth/           # OAuth authentication
│   ├── data/           # Data ingestion & sync
│   └── storage/        # Local data management
├── types/              # TypeScript definitions
├── utils/              # Helper functions
├── constants/          # App constants
└── navigation/         # Navigation configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- Expo CLI
- iOS Simulator or Android Emulator
- OpenAI API key (optional - demo works without)

### Installation

1. **Clone and install dependencies**
```bash
cd health-assistant
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys (optional for demo)
```

3. **Start the development server**
```bash
npm start
```

4. **Run on device/simulator**
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 📱 Usage

### Demo Mode
The app starts in demo mode with preloaded sample data, perfect for:
- Presentations and demos
- Testing without real health data
- Understanding app capabilities

### Real Data Integration
1. **Connect Wearables**: Go to Settings → Data Connections
2. **Configure OAuth**: Set up provider credentials in .env
3. **Grant Permissions**: Authorize data access through OAuth flows
4. **Set Consent Scope**: Choose wellness-only or underwriting permissions

### AI Features
- **Daily Brief**: Automatically generated each morning
- **Food Suggestions**: Based on nutrition data and health goals
- **Trend Analysis**: Weekly/monthly health pattern insights
- **Benefits Matching**: Personalized program recommendations

## 🔧 Configuration

### Environment Variables
- `EXPO_PUBLIC_OPENAI_API_KEY`: OpenAI API key for AI features
- `EXPO_PUBLIC_WHOOP_CLIENT_ID/SECRET`: WHOOP OAuth credentials
- `EXPO_PUBLIC_STRAVA_CLIENT_ID/SECRET`: Strava OAuth credentials
- `EXPO_PUBLIC_CRONOMETER_CLIENT_ID/SECRET`: Cronometer OAuth credentials

### Provider Setup
Each health data provider requires OAuth app registration:

1. **WHOOP**: Register at WHOOP Developer Portal
2. **Strava**: Create app at Strava API Settings
3. **Cronometer**: Apply for API access
4. **Apple Health**: Configure HealthKit capabilities

## 🏥 Healthcare Compliance

### Privacy Features
- **Data Minimization**: Only collect necessary health data
- **Consent Management**: Granular control over data usage
- **Audit Trails**: Complete logging of all data operations
- **Secure Storage**: Encryption at rest and in transit
- **User Control**: Easy data export and deletion

### Compliance Standards
- HIPAA compliance architecture
- GDPR data protection principles
- SOC 2 security controls
- FDA guidance for digital health tools

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript strict mode
2. Use functional components with hooks
3. Implement comprehensive error handling
4. Add audit logging for all user actions
5. Write unit tests for critical functions

### Code Style
- ESLint configuration included
- Prettier for code formatting
- Conventional commits for git history

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Troubleshooting
- **Demo mode not working**: Clear app data and restart
- **OAuth failures**: Verify provider credentials in .env
- **Sync issues**: Check network connectivity and provider status

### Getting Help
- Check the Issues tab for known problems
- Review the documentation in /docs
- Contact the development team for enterprise support

## 🔮 Roadmap

### Upcoming Features
- [ ] Apple Watch companion app
- [ ] Telehealth integration
- [ ] Advanced ML models for health prediction
- [ ] Social features for health challenges
- [ ] Integration with electronic health records (EHR)
- [ ] Multi-language support
- [ ] Accessibility improvements

### Technical Improvements
- [ ] GraphQL API layer
- [ ] Real-time data streaming
- [ ] Advanced caching strategies
- [ ] Performance optimizations
- [ ] Automated testing suite
- [ ] CI/CD pipeline

---

**Built with ❤️ for better health outcomes**
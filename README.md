# Portfolio AI Functions

This document provides an overview of the AI-powered features available in the Portfolio application.

## AI Portfolio Creation

Create optimized investment portfolios using AI with customizable parameters:

- **Asset Allocation**: Set your desired allocation percentages for stocks, bonds, and alternatives
- **Optimization Strategies**:
  - **Risk Level (DRC)**: Choose your risk tolerance on a scale from 1 (conservative) to 5 (aggressive)
  - **Sharpe Ratio**: Optimize for the best risk-adjusted returns
  - **AI Recommended**: Let AI determine the optimal strategy based on current market conditions
- **Portfolio Suggestions**: Receive AI-generated portfolio suggestions with:
  - Detailed asset allocation recommendations
  - Expected returns analysis
  - Risk assessment
  - Investment rationale

## Portfolio Analysis

Get AI-powered insights on your existing portfolios:

- **Performance Analysis**:
  - Summary of portfolio performance
  - Best and worst performing assets
  - Performance contribution analysis
  - Actionable recommendations for improvement

- **Risk Analysis**:
  - Comprehensive risk assessment
  - Risk factor identification and exposure levels
  - Impact analysis of various risk factors
  - Risk mitigation recommendations

- **Allocation Analysis**:
  - Current vs. benchmark allocation comparison
  - Asset allocation optimization suggestions
  - Diversification assessment
  - Rebalancing recommendations

## Portfolio Rebalancing

Optimize your existing portfolios with AI-powered rebalancing:

- **Rebalance Strategies**:
  - Risk Level (DRC): Adjust portfolio to match your desired risk level
  - Sharpe Ratio: Rebalance to maximize risk-adjusted returns
  - AI Recommended: Let AI determine the optimal rebalancing strategy
- **Rebalance Results**:
  - Current vs. target allocation comparison
  - Specific action recommendations for each asset
  - Implementation guidance

## Market Sentiment Analysis

Gain insights into current market conditions:

- **Overall Market Sentiment**: AI-generated assessment of market sentiment on a scale from -1 to 1
- **Key Factors**: Analysis of economic data, central bank policies, corporate earnings, and geopolitical events
- **Sector Outlook**: Sentiment analysis for specific market sectors
- **Investment Implications**: Actionable insights based on current market sentiment

## AI Settings Configuration

Customize your AI experience:

- **Provider Selection**: Choose between different AI providers (OpenRouter, OpenAI, Anthropic)
- **Model Selection**: Select from various AI models with different capabilities
- **API Key Management**: Securely store and manage your API keys
- **Connection Testing**: Verify your AI configuration is working correctly

## Technical Implementation

The AI functionality is powered by:

- **OpenRouter API**: Primary AI provider with access to multiple models
- **Local Storage Settings**: Secure storage of AI configuration
- **Fallback Mechanisms**: Mock data generation when API is unavailable
- **Error Handling**: Robust error management for API interactions

## Available AI Models

The application supports various AI models through OpenRouter:

- Google Gemini 2.0 Flash Lite
- Google Gemini Pro
- Anthropic Claude 3 Opus
- Anthropic Claude 3 Sonnet
- OpenAI GPT-4o
- OpenAI GPT-4 Turbo
- Deepseek r1 distill 1.5b
- Qwen 2.5-72b
- Meta Llama 3 70B

import { pipeline } from '@huggingface/transformers';

export interface SkillAnalysis {
  name: string;
  category: 'Technical' | 'Soft' | 'Domain' | 'Language';
  confidence: number;
  isExplicit: boolean;
  evidence: string[];
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface CareerInsight {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'strength' | 'gap' | 'recommendation';
}

class AIAgent {
  private classifier: any = null;
  private embedder: any = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🤖 Initializing AI Agent...');
    
    try {
      // Initialize text classification pipeline for skill categorization
      console.log('📦 Loading classification model...');
      this.classifier = await pipeline(
        'text-classification',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        { device: 'webgpu' }
      );

      // Initialize feature extraction for semantic understanding
      console.log('📦 Loading embedding model...');
      this.embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        { device: 'webgpu' }
      );

      this.isInitialized = true;
      console.log('✅ AI Agent initialized successfully');
    } catch (error) {
      console.warn('⚠️ WebGPU not available, falling back to CPU');
      // Fallback to CPU if WebGPU fails
      this.classifier = await pipeline(
        'text-classification',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
      );
      this.embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
      this.isInitialized = true;
    }
  }

  async analyzeCV(text: string, extractedSkills: string[]): Promise<{
    skills: SkillAnalysis[];
    insights: CareerInsight[];
    summary: string;
    overallScore: number;
  }> {
    await this.initialize();
    
    console.log('🔬 Starting AI analysis...');

    // Analyze each skill in detail
    const skillAnalyses = await this.analyzeSkills(text, extractedSkills);
    
    // Generate career insights
    const insights = this.generateInsights(skillAnalyses, text);
    
    // Generate summary
    const summary = this.generateSummary(skillAnalyses, insights);
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore(skillAnalyses);

    console.log('✅ AI analysis completed');
    console.log('📊 Overall Score:', overallScore);
    console.log('🎯 Skills Analyzed:', skillAnalyses.length);
    console.log('💡 Insights Generated:', insights.length);

    return {
      skills: skillAnalyses,
      insights,
      summary,
      overallScore
    };
  }

  private async analyzeSkills(text: string, extractedSkills: string[]): Promise<SkillAnalysis[]> {
    const analyses: SkillAnalysis[] = [];
    const lowerText = text.toLowerCase();

    for (const skill of extractedSkills) {
      const skillLower = skill.toLowerCase();
      
      // Find evidence of skill in text
      const evidence: string[] = [];
      const sentences = text.split(/[.!?]+/);
      
      sentences.forEach(sentence => {
        if (sentence.toLowerCase().includes(skillLower)) {
          evidence.push(sentence.trim());
        }
      });

      // Determine if skill is explicit or implicit
      const isExplicit = evidence.length > 0;
      
      // Categorize skill
      const category = this.categorizeSkill(skill);
      
      // Estimate proficiency based on context
      const proficiencyLevel = this.estimateProficiency(skill, text, evidence);
      
      // Calculate confidence based on evidence
      const confidence = this.calculateSkillConfidence(evidence, isExplicit);

      analyses.push({
        name: skill,
        category,
        confidence,
        isExplicit,
        evidence: evidence.slice(0, 2), // Keep top 2 evidence
        proficiencyLevel
      });
    }

    // Sort by confidence
    return analyses.sort((a, b) => b.confidence - a.confidence);
  }

  private categorizeSkill(skill: string): SkillAnalysis['category'] {
    const skillLower = skill.toLowerCase();

    const technicalKeywords = [
      'react', 'javascript', 'python', 'java', 'typescript', 'html', 'css',
      'sql', 'mongodb', 'aws', 'docker', 'kubernetes', 'git', 'node.js',
      'api', 'database', 'cloud', 'devops', 'frontend', 'backend'
    ];

    const softKeywords = [
      'leadership', 'communication', 'problem solving', 'teamwork',
      'management', 'collaboration', 'creativity', 'adaptability',
      'critical thinking', 'time management', 'negotiation'
    ];

    const languageKeywords = [
      'english', 'spanish', 'french', 'german', 'chinese', 'japanese',
      'arabic', 'portuguese', 'russian', 'hindi'
    ];

    if (technicalKeywords.some(kw => skillLower.includes(kw))) return 'Technical';
    if (softKeywords.some(kw => skillLower.includes(kw))) return 'Soft';
    if (languageKeywords.some(kw => skillLower.includes(kw))) return 'Language';
    
    return 'Domain';
  }

  private estimateProficiency(
    skill: string, 
    text: string, 
    evidence: string[]
  ): SkillAnalysis['proficiencyLevel'] {
    const skillLower = skill.toLowerCase();
    const textLower = text.toLowerCase();

    // Check for proficiency indicators
    const expertIndicators = ['expert', 'advanced', 'senior', 'lead', 'architect', '10+ years'];
    const advancedIndicators = ['proficient', 'strong', '5+ years', 'experienced'];
    const intermediateIndicators = ['familiar', 'working knowledge', '2+ years', 'moderate'];
    
    for (const indicator of expertIndicators) {
      if (textLower.includes(indicator) && textLower.includes(skillLower)) {
        return 'Expert';
      }
    }

    for (const indicator of advancedIndicators) {
      if (textLower.includes(indicator) && textLower.includes(skillLower)) {
        return 'Advanced';
      }
    }

    for (const indicator of intermediateIndicators) {
      if (textLower.includes(indicator) && textLower.includes(skillLower)) {
        return 'Intermediate';
      }
    }

    // Default based on evidence count
    if (evidence.length >= 3) return 'Advanced';
    if (evidence.length >= 2) return 'Intermediate';
    return 'Beginner';
  }

  private calculateSkillConfidence(evidence: string[], isExplicit: boolean): number {
    let confidence = isExplicit ? 70 : 40;
    
    // Add confidence based on evidence
    confidence += Math.min(evidence.length * 5, 25);
    
    // Add confidence based on evidence quality (longer evidence = more detailed)
    const avgEvidenceLength = evidence.reduce((sum, e) => sum + e.length, 0) / (evidence.length || 1);
    if (avgEvidenceLength > 50) confidence += 5;
    
    return Math.min(confidence, 100);
  }

  private generateInsights(skills: SkillAnalysis[], text: string): CareerInsight[] {
    const insights: CareerInsight[] = [];

    // Identify strengths
    const topSkills = skills.slice(0, 5);
    if (topSkills.length > 0) {
      insights.push({
        title: 'Core Strengths Identified',
        description: `Your top skills include ${topSkills.map(s => s.name).join(', ')}. These form the foundation of your professional profile.`,
        priority: 'high',
        category: 'strength'
      });
    }

    // Check for balance between technical and soft skills
    const technicalCount = skills.filter(s => s.category === 'Technical').length;
    const softCount = skills.filter(s => s.category === 'Soft').length;

    if (technicalCount > softCount * 2) {
      insights.push({
        title: 'Develop Soft Skills',
        description: 'Consider highlighting more soft skills like leadership, communication, and teamwork to balance your profile.',
        priority: 'medium',
        category: 'gap'
      });
    }

    // Identify implicit skills
    const implicitSkills = skills.filter(s => !s.isExplicit);
    if (implicitSkills.length > 3) {
      insights.push({
        title: 'Hidden Talents Discovered',
        description: `We identified ${implicitSkills.length} implicit skills that you possess but haven't explicitly mentioned. Consider highlighting these.`,
        priority: 'high',
        category: 'recommendation'
      });
    }

    // Check proficiency distribution
    const expertSkills = skills.filter(s => s.proficiencyLevel === 'Expert');
    if (expertSkills.length > 0) {
      insights.push({
        title: 'Expert-Level Capabilities',
        description: `You demonstrate expert-level proficiency in ${expertSkills.map(s => s.name).join(', ')}. Leverage these as your key differentiators.`,
        priority: 'high',
        category: 'strength'
      });
    }

    // Suggest learning paths
    const beginnerSkills = skills.filter(s => s.proficiencyLevel === 'Beginner');
    if (beginnerSkills.length > 0) {
      insights.push({
        title: 'Growth Opportunities',
        description: `Focus on developing ${beginnerSkills.slice(0, 3).map(s => s.name).join(', ')} to enhance your skill portfolio.`,
        priority: 'medium',
        category: 'recommendation'
      });
    }

    return insights;
  }

  private generateSummary(skills: SkillAnalysis[], insights: CareerInsight[]): string {
    const totalSkills = skills.length;
    const technicalSkills = skills.filter(s => s.category === 'Technical').length;
    const softSkills = skills.filter(s => s.category === 'Soft').length;
    const expertSkills = skills.filter(s => s.proficiencyLevel === 'Expert').length;
    const advancedSkills = skills.filter(s => s.proficiencyLevel === 'Advanced').length;

    return `Your profile demonstrates ${totalSkills} distinct skills, including ${technicalSkills} technical and ${softSkills} soft skills. ` +
           `You show expert-level proficiency in ${expertSkills} areas and advanced capabilities in ${advancedSkills} more. ` +
           `Our AI analysis identified ${insights.filter(i => i.category === 'strength').length} key strengths and ` +
           `${insights.filter(i => i.category === 'recommendation').length} opportunities for growth.`;
  }

  private calculateOverallScore(skills: SkillAnalysis[]): number {
    if (skills.length === 0) return 0;

    // Calculate based on multiple factors
    const avgConfidence = skills.reduce((sum, s) => sum + s.confidence, 0) / skills.length;
    
    const proficiencyScore = skills.reduce((sum, s) => {
      const scores = { 'Beginner': 25, 'Intermediate': 50, 'Advanced': 75, 'Expert': 100 };
      return sum + scores[s.proficiencyLevel];
    }, 0) / skills.length;

    const explicitRatio = skills.filter(s => s.isExplicit).length / skills.length * 100;

    // Weighted average
    const score = (avgConfidence * 0.4) + (proficiencyScore * 0.4) + (explicitRatio * 0.2);

    return Math.round(score);
  }
}

export const aiAgent = new AIAgent();

import { supabase } from '@/integrations/supabase/client';
import { SkillAnalysis, CareerInsight } from './aiAgent';

export interface SavedAnalysis {
  id: string;
  user_id: string;
  overall_score: number;
  skills_identified: number;
  summary: string;
  insights: any;
  analysis_data: any;
  created_at: string;
}

class DatabaseService {
  async saveAnalysisToDatabase(
    userId: string,
    analysisData: {
      skills: SkillAnalysis[];
      insights: CareerInsight[];
      summary: string;
      overallScore: number;
    },
    extractedText: string,
    dataSourceId?: string
  ) {
    try {
      console.log('💾 Saving analysis to database...');

      // Save analysis history
      const { data: historyData, error: historyError } = await supabase
        .from('analysis_history')
        .insert({
          user_id: userId,
          data_source_id: dataSourceId,
          overall_score: analysisData.overallScore,
          skills_identified: analysisData.skills.length,
          summary: analysisData.summary,
          insights: analysisData.insights as any,
          analysis_data: {
            skills: analysisData.skills,
            extracted_text_preview: extractedText.slice(0, 1000)
          } as any
        })
        .select()
        .single();

      if (historyError) throw historyError;

      // Get or create skill framework entries and save user skills
      for (const skill of analysisData.skills) {
        // First, find or create the skill in the framework
        let { data: frameworkSkill } = await supabase
          .from('skill_framework')
          .select('id')
          .eq('name', skill.name)
          .single();

        // If skill doesn't exist in framework, create it
        if (!frameworkSkill) {
          const { data: newSkill } = await supabase
            .from('skill_framework')
            .insert({
              name: skill.name,
              category: skill.category,
              description: `AI-identified skill: ${skill.name}`,
              keywords: [skill.name.toLowerCase()]
            })
            .select()
            .single();

          frameworkSkill = newSkill;
        }

        if (frameworkSkill) {
          // Save or update user skill
          await supabase
            .from('user_skills')
            .upsert({
              user_id: userId,
              skill_id: frameworkSkill.id,
              confidence_score: skill.confidence,
              proficiency_level: skill.proficiencyLevel,
              is_explicit: skill.isExplicit,
              evidence: skill.evidence,
              privacy_level: 'private'
            }, {
              onConflict: 'user_id,skill_id'
            });
        }
      }

      console.log('✅ Analysis saved successfully');
      return historyData;
    } catch (error) {
      console.error('❌ Error saving analysis:', error);
      throw error;
    }
  }

  async saveDataSource(
    userId: string,
    sourceType: string,
    sourceName: string,
    content: string,
    metadata?: any
  ) {
    try {
      const { data, error } = await supabase
        .from('data_sources')
        .insert({
          user_id: userId,
          source_type: sourceType as any,
          source_name: sourceName,
          raw_content: content,
          processed_at: new Date().toISOString(),
          metadata: metadata as any
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving data source:', error);
      throw error;
    }
  }

  async getUserAnalysisHistory(userId: string) {
    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      return [];
    }
  }

  async getUserSkills(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_skills')
        .select(`
          *,
          skill_framework (
            name,
            category,
            description
          )
        `)
        .eq('user_id', userId)
        .order('confidence_score', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user skills:', error);
      return [];
    }
  }

  async getLatestAnalysis(userId: string): Promise<SavedAnalysis | null> {
    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching latest analysis:', error);
      return null;
    }
  }

  async updateUserPrivacySettings(
    userId: string,
    privacyLevel: 'private' | 'organization' | 'public'
  ) {
    try {
      // Update all user skills privacy
      const { error } = await supabase
        .from('user_skills')
        .update({ privacy_level: privacyLevel })
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      return false;
    }
  }

  async getPublicSkillProfiles(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('user_skills')
        .select(`
          *,
          profiles!inner (
            full_name,
            job_title
          ),
          skill_framework (
            name,
            category
          )
        `)
        .eq('privacy_level', 'public')
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching public profiles:', error);
      return [];
    }
  }

  async getOrganizationSkills(organizationId: string) {
    try {
      const { data, error } = await supabase
        .from('user_skills')
        .select(`
          *,
          profiles!inner (
            full_name,
            job_title,
            organization_id
          ),
          skill_framework (
            name,
            category
          )
        `)
        .eq('profiles.organization_id', organizationId)
        .in('privacy_level', ['organization', 'public']);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching organization skills:', error);
      return [];
    }
  }

  // Endorse a skill
  async endorseSkill(userSkillId: string, endorsedBy: string, endorsementText?: string) {
    try {
      const { data, error } = await supabase
        .from("skill_endorsements")
        .insert({
          user_skill_id: userSkillId,
          endorsed_by: endorsedBy,
          endorsement_text: endorsementText,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error endorsing skill:', error);
      throw error;
    }
  }

  // Get endorsements for a skill
  async getSkillEndorsements(userSkillId: string) {
    try {
      const { data, error } = await supabase
        .from("skill_endorsements")
        .select(`
          *,
          endorsed_by_profile:profiles!skill_endorsements_endorsed_by_fkey(full_name, avatar_url)
        `)
        .eq("user_skill_id", userSkillId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching endorsements:', error);
      return [];
    }
  }

  // Delete an endorsement
  async deleteEndorsement(endorsementId: string) {
    try {
      const { error } = await supabase
        .from("skill_endorsements")
        .delete()
        .eq("id", endorsementId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting endorsement:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();

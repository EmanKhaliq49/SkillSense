import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker with proper path
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface OCRResult {
  text: string;
  confidence: number;
  isCV: boolean;
  extractedData: {
    name?: string;
    email?: string;
    phone?: string;
    skills: string[];
    experience: string[];
    education: string[];
  };
}

class OCRService {
  private cvKeywords = [
    'resume', 'curriculum vitae', 'cv', 'experience', 'education', 
    'skills', 'employment', 'work history', 'professional', 'qualifications',
    'career', 'objective', 'summary', 'references', 'accomplishments',
    'certifications', 'projects', 'languages'
  ];

  private skillKeywords = [
    'react', 'javascript', 'typescript', 'python', 'java', 'node.js',
    'html', 'css', 'sql', 'mongodb', 'aws', 'docker', 'kubernetes',
    'git', 'agile', 'leadership', 'communication', 'problem solving',
    'team work', 'project management', 'data analysis', 'machine learning',
    'ai', 'devops', 'cloud', 'frontend', 'backend', 'fullstack'
  ];

  async extractTextFromImage(file: File): Promise<string> {
    console.log('🔍 Starting OCR on image...');
    
    const result = await Tesseract.recognize(file, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    console.log('✅ OCR completed with confidence:', result.data.confidence);
    return result.data.text;
  }

  async extractTextFromPDF(file: File): Promise<string> {
    console.log('📄 Starting PDF text extraction...');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      });
      
      const pdf = await loadingTask.promise;
      console.log(`📚 PDF loaded: ${pdf.numPages} pages`);
      
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n';
          console.log(`📃 Extracted page ${i}/${pdf.numPages} (${pageText.length} chars)`);
        } catch (pageError) {
          console.warn(`⚠️ Error extracting page ${i}:`, pageError);
          // Continue with other pages
        }
      }

      if (!fullText.trim()) {
        throw new Error('No text could be extracted from the PDF. It might be an image-based PDF.');
      }

      console.log('✅ PDF extraction completed:', fullText.length, 'characters');
      return fullText;
    } catch (error) {
      console.error('❌ PDF extraction error:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processDocument(file: File): Promise<OCRResult> {
    console.log('🚀 Processing document:', file.name);
    
    let text = '';
    const fileType = file.type;

    try {
      if (fileType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        console.log('📄 Detected PDF file');
        text = await this.extractTextFromPDF(file);
      } else if (fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name)) {
        console.log('🖼️ Detected image file');
        text = await this.extractTextFromImage(file);
      } else if (fileType.includes('text') || file.name.endsWith('.txt')) {
        console.log('📝 Detected text file');
        text = await file.text();
      } else {
        throw new Error(`Unsupported file format: ${file.name}. Please upload PDF, image, or text file.`);
      }

      if (!text || text.trim().length < 50) {
        throw new Error('Unable to extract sufficient text from document. Please ensure the file contains readable text.');
      }

      // Validate if it's a CV
      const isCV = this.validateCV(text);
      
      if (!isCV) {
        console.warn('⚠️ Document does not appear to be a CV/Resume');
      }

      // Extract structured data
      const extractedData = this.extractStructuredData(text);
      
      // Calculate confidence score
      const confidence = this.calculateConfidence(text, extractedData);

      console.log('✅ Document processing completed');
      console.log('📊 Confidence:', confidence);
      console.log('📝 Is CV:', isCV);
      console.log('🎯 Skills found:', extractedData.skills.length);

      return {
        text,
        confidence,
        isCV,
        extractedData
      };
    } catch (error) {
      console.error('❌ Error processing document:', error);
      throw error;
    }
  }

  private validateCV(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    // Check for CV-related keywords
    const keywordMatches = this.cvKeywords.filter(keyword => 
      lowerText.includes(keyword)
    ).length;

    // Check for typical CV sections (at least 3 should be present)
    const hasExperience = /experience|employment|work history/i.test(text);
    const hasEducation = /education|degree|university|college/i.test(text);
    const hasSkills = /skills|competencies|expertise/i.test(text);
    const hasContact = /@|phone|email|linkedin/i.test(text);

    const sectionCount = [hasExperience, hasEducation, hasSkills, hasContact]
      .filter(Boolean).length;

    // Must have at least 2 CV keywords and 3 typical sections
    return keywordMatches >= 2 && sectionCount >= 3;
  }

  private extractStructuredData(text: string) {
    const data: OCRResult['extractedData'] = {
      skills: [],
      experience: [],
      education: []
    };

    // Extract email
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) data.email = emailMatch[0];

    // Extract phone
    const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) data.phone = phoneMatch[0];

    // Extract skills
    const lowerText = text.toLowerCase();
    this.skillKeywords.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        data.skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    });

    // Remove duplicates
    data.skills = [...new Set(data.skills)];

    // Extract experience sections
    const expRegex = /(?:experience|employment)[\s\S]{0,500}?(?=education|skills|$)/gi;
    const expMatches = text.match(expRegex);
    if (expMatches) {
      data.experience = expMatches.map(exp => exp.trim());
    }

    // Extract education sections
    const eduRegex = /(?:education|academic)[\s\S]{0,300}?(?=experience|skills|$)/gi;
    const eduMatches = text.match(eduRegex);
    if (eduMatches) {
      data.education = eduMatches.map(edu => edu.trim());
    }

    return data;
  }

  private calculateConfidence(text: string, extractedData: OCRResult['extractedData']): number {
    let confidence = 0;

    // Text length check (reasonable CV should have substantial content)
    if (text.length > 500) confidence += 20;
    if (text.length > 1000) confidence += 10;

    // Skills found
    if (extractedData.skills.length > 0) confidence += 20;
    if (extractedData.skills.length > 5) confidence += 15;

    // Contact information
    if (extractedData.email) confidence += 15;
    if (extractedData.phone) confidence += 10;

    // Experience and education
    if (extractedData.experience.length > 0) confidence += 5;
    if (extractedData.education.length > 0) confidence += 5;

    return Math.min(confidence, 100);
  }
}

export const ocrService = new OCRService();

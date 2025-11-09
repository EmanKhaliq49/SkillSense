# SkillSense - Quick Start Guide

## 🎯 Welcome to SkillSense!

Your comprehensive AI-powered skill analysis platform is ready. Here's how to get started.

---

## 📋 What You Can Do

### 1. **Upload Your CV** (`/upload`)
Start by uploading your resume in any format:
- PDF, Word, Images, or Text
- OCR automatically extracts text
- AI analyzes skills, experience, and qualifications
- Get instant skill profile with confidence scores

### 2. **Connect GitHub** (`/connect`)
Link your GitHub profile to analyze:
- Programming languages you use
- Frameworks and tools in your repositories
- Contribution patterns and code quality
- Technical expertise from projects

**How to use:**
- Enter your GitHub username (e.g., `octocat`)
- Or paste your full GitHub URL (e.g., `github.com/octocat`)
- AI analyzes your repositories and commits

### 3. **Import LinkedIn** (`/connect`)
Connect your LinkedIn profile:
- Professional identity verification
- Career trajectory analysis
- Secure OAuth authentication
- No password sharing needed

**Note:** LinkedIn OAuth provides limited data. For best results, also upload your CV.

### 4. **Analyze Blogs & Articles** (`/sources`)
Extract skills from your published content:
- Paste any blog or article URL
- AI analyzes writing style and expertise
- Identifies thought leadership skills
- Assesses communication abilities

### 5. **Process Performance Reviews** (`/sources`)
Learn from feedback:
- Paste performance review text
- Identifies soft skills from feedback
- Extracts strengths and growth areas
- Tracks leadership qualities

### 6. **Set Career Goals** (`/goals`)
Plan your professional development:
- Define career objectives
- Specify target skills to learn
- Set timelines and deadlines
- Track progress with percentages
- Mark goals as Active, Completed, Paused, or Archived

---

## 🚀 Recommended Workflow

### Step 1: Create Your Account
1. Go to `/auth`
2. Sign up with email
3. Verify your email (auto-confirmed in development)
4. You're ready to go!

### Step 2: Build Your Skill Profile
**Start with your strongest source:**

Option A - **If you have a CV:**
1. Go to `/upload`
2. Upload your resume
3. Wait for AI analysis (30-60 seconds)
4. View results in Dashboard

Option B - **If you're a developer:**
1. Go to `/connect`
2. Enter your GitHub username
3. Wait for repository analysis (10-15 seconds)
4. View extracted skills

### Step 3: Add More Sources
The more sources, the better your profile:
1. Go to `/sources` to add blogs or reviews
2. Return to `/connect` for LinkedIn
3. Each source adds new skills and insights

### Step 4: Review Your Dashboard
1. Go to `/dashboard`
2. See aggregated skill profile
3. Review confidence scores
4. Check career insights
5. Identify skill gaps

### Step 5: Set Your Goals
1. Go to `/goals`
2. Click "Add Goal"
3. Define what you want to achieve
4. Specify target skills
5. Track your progress

---

## 📊 Understanding Your Results

### Skill Scores
- **90-100%**: Expert-level, strong evidence
- **75-89%**: Advanced proficiency
- **60-74%**: Intermediate level
- **40-59%**: Beginner to intermediate
- **Below 40%**: Implied skill, needs validation

### Skill Categories
- **Technical**: Programming, tools, frameworks
- **Soft**: Leadership, communication, teamwork
- **Domain**: Industry knowledge, specializations
- **Language**: Human languages you speak/write

### Proficiency Levels
- **Expert**: 5+ years or exceptional demonstrations
- **Advanced**: 3-5 years or strong evidence
- **Intermediate**: 1-3 years or moderate evidence
- **Beginner**: Less than 1 year or basic mentions

### Career Insights
- **Strengths** (Green): Your core competencies
- **Gaps** (Yellow): Skills to develop
- **Recommendations** (Blue): Suggested next steps

---

## 🎓 Tips for Best Results

### For CV Upload
✅ Use a well-formatted resume
✅ Include specific examples and metrics
✅ Mention technologies and tools explicitly
✅ Describe achievements, not just responsibilities
❌ Don't use overly creative formats (affects OCR)
❌ Avoid images-only PDFs without text layer

### For GitHub Analysis
✅ Maintain active repositories
✅ Use descriptive README files
✅ Add topics to your repositories
✅ Contribute regularly
❌ Don't rely solely on forked repos
❌ Private repos won't be analyzed

### For Blog Analysis
✅ Share technical articles or thought leadership
✅ Ensure content is publicly accessible
✅ Use original content, not quotes
❌ Don't use paywalled content
❌ Avoid very short posts (< 300 words)

### For Performance Reviews
✅ Include both strengths and growth areas
✅ Paste full feedback, not summaries
✅ Include quantifiable achievements
✅ Add context about your role
❌ Don't include only negative feedback
❌ Avoid generic statements

---

## 🔒 Privacy & Security

### Your Data is Safe
- **Row-Level Security**: You can only see your own data
- **Encrypted Storage**: All data encrypted at rest
- **No Public Sharing**: Your profile is private by default
- **GDPR Compliant**: Request data deletion anytime

### What We Store
- Uploaded documents (text only, not original files)
- GitHub analysis results (not your code)
- LinkedIn basic profile (OAuth data only)
- Blog URLs and analysis (not the full websites)
- Performance review text (as you provide it)

### What We DON'T Store
- Original file uploads (converted to text, then deleted)
- GitHub source code
- LinkedIn connections or messages
- Passwords (we use secure OAuth)

---

## 🛠️ Troubleshooting

### "Failed to analyze CV"
**Solutions:**
- Ensure file is a valid CV/Resume
- Try a different format (PDF works best)
- Check file size (max 20MB)
- Make sure document is text-based, not image-only

### "GitHub user not found"
**Solutions:**
- Double-check username spelling
- Try using `github.com/username` format
- Ensure profile is public
- Verify account exists

### "LinkedIn not connected"
**Solutions:**
- Ensure LinkedIn OAuth is enabled in backend
- Check if popup blockers are disabled
- Try connecting in incognito mode
- Contact support if issue persists

### "AI credits exhausted"
**Solutions:**
- Free tier has limited AI usage
- Upgrade to paid plan for more credits
- Wait for credits to refresh (daily/monthly)
- See Settings → Usage for credit status

---

## 📈 Next Steps

### Immediate Actions
1. ✅ Upload your CV or connect GitHub
2. ✅ Review your skill profile in Dashboard
3. ✅ Set at least one career goal
4. ✅ Explore job matching (coming soon)

### This Week
1. Add 2-3 more data sources
2. Connect LinkedIn
3. Analyze a blog post you wrote
4. Update goal progress

### This Month
1. Complete one learning resource
2. Get skills endorsed by peers
3. Update your CV and re-analyze
4. Track skill evolution over time

---

## 💡 Pro Tips

### Maximize Your Profile
1. **Add Multiple Sources**: Each source adds unique insights
2. **Update Regularly**: Re-analyze when you learn new skills
3. **Set SMART Goals**: Specific, Measurable, Achievable, Relevant, Time-bound
4. **Track Progress**: Update goal completion percentages
5. **Review Insights**: Act on AI recommendations

### Career Development
1. **Focus on Gaps**: Prioritize high-priority gaps
2. **Leverage Strengths**: Double down on expert skills
3. **Balance Skills**: Mix technical and soft skills
4. **Stay Current**: Add new projects and achievements
5. **Network Strategically**: Share skills with relevant connections

---

## 📞 Support & Resources

### Documentation
- Full feature list: See `FEATURES.md`
- Technical details: See `README.md`
- This guide: `QUICKSTART.md`

### Navigation Map
```
/                - Homepage (start here)
/auth            - Sign up / Sign in
/upload          - Upload CV
/connect         - GitHub & LinkedIn
/sources         - Blogs & Reviews
/goals           - Career goals
/dashboard       - Your skill profile
/jobs            - Job matching
/team            - Team analysis
/settings        - Account settings
```

### Feature Status
✅ CV Upload & Analysis - **LIVE**
✅ GitHub Integration - **LIVE**
✅ LinkedIn Import - **LIVE** (requires OAuth config)
✅ Blog Analysis - **LIVE**
✅ Performance Reviews - **LIVE**
✅ Career Goals - **LIVE**
✅ Skill Dashboard - **LIVE**
✅ Job Matching - **AVAILABLE**
✅ Team Analysis - **AVAILABLE**

---

## 🎉 You're All Set!

Start building your comprehensive skill profile now. The AI will discover both your explicit and implicit skills, providing actionable insights to accelerate your career growth.

**First time user? Start here:**
1. Go to `/auth` and create an account
2. Visit `/upload` and upload your CV
3. Check `/dashboard` to see your results
4. Explore `/connect` and `/sources` to add more data
5. Set goals at `/goals` to track your development

---

**Questions or feedback?** 
Your skill profile is your career compass. Let SkillSense guide you to success! 🚀

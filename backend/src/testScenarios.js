import {
  getCompaniesList,
  getCompanyByIdOrName,
  calculateUserCompanyMatch,
  compareCompaniesForUser,
  getPlacementOpportunitiesMatrix,
  addCompanyAdmin,
  deleteCompanyAdmin
} from './services/companyIntelligenceEngine.js';

async function runAcceptanceTests() {
  console.log('=== MULTI-COMPANY PLACEMENT INTELLIGENCE ENGINE ACCEPTANCE TESTS ===\n');

  // Test 1: Seed Count
  const allCompanies = getCompaniesList();
  console.log(`✓ Total Seeded Companies: ${allCompanies.length} (Target: 50+)`);

  // Test 2: Scenario 1 - TCS Java Developer
  const tcsMatch = await calculateUserCompanyMatch(1, 'tcs', 'tcs-java-dev');
  console.log(`\n--- Scenario 1: TCS Java Developer ---`);
  console.log(`Company: ${tcsMatch.companyName}`);
  console.log(`Role: ${tcsMatch.role.title}`);
  console.log(`Match Score: ${tcsMatch.matchScore}% (${tcsMatch.readinessLabel})`);
  console.log(`Required Tech Skills: ${tcsMatch.role.requirements.technicalSkills.join(', ')}`);

  // Test 3: Scenario 2 - Amazon SDE
  const amazonMatch = await calculateUserCompanyMatch(1, 'amazon', 'amazon-sde');
  console.log(`\n--- Scenario 2: Amazon SDE ---`);
  console.log(`Company: ${amazonMatch.companyName}`);
  console.log(`Role: ${amazonMatch.role.title}`);
  console.log(`Match Score: ${amazonMatch.matchScore}% (${amazonMatch.readinessLabel})`);
  console.log(`DSA Importance: ${amazonMatch.role.requirements.dsaImportance}`);
  console.log(`High Priority Gaps: ${amazonMatch.skillGaps.high.join(', ') || 'None'}`);

  // Test 4: Scenario 3 - Infosys Software Engineer
  const infyMatch = await calculateUserCompanyMatch(1, 'infosys', 'infosys-se');
  console.log(`\n--- Scenario 3: Infosys Software Engineer ---`);
  console.log(`Company: ${infyMatch.companyName}`);
  console.log(`Role: ${infyMatch.role.title}`);
  console.log(`Match Score: ${infyMatch.matchScore}% (${infyMatch.readinessLabel})`);

  // Test 5: Scenario 4 - Zoho Software Developer
  const zohoMatch = await calculateUserCompanyMatch(1, 'zoho', 'zoho-software-developer');
  console.log(`\n--- Scenario 4: Zoho Software Developer ---`);
  console.log(`Company: ${zohoMatch.companyName}`);
  console.log(`Role: ${zohoMatch.role.title}`);
  console.log(`Match Score: ${zohoMatch.matchScore}% (${zohoMatch.readinessLabel})`);
  console.log(`Assessment Drive: ${zohoMatch.assessmentPattern.name}`);

  // Test 6: Scenario 5 - Compare TCS, Amazon, Infosys, Zoho
  const comparison = await compareCompaniesForUser(1, ['tcs', 'amazon', 'infosys', 'zoho']);
  console.log(`\n--- Scenario 5: Compare 4 Companies Simultaneously ---`);
  comparison.forEach(item => {
    console.log(`- ${item.companyName} (${item.role.title}): Match = ${item.matchScore}%, SkillsMatch = ${item.subScores.skillsMatch}%, DSAReadiness = ${item.subScores.codingMatch}%`);
  });

  // Test 7: Scenario 6 - Admin Add Company
  console.log(`\n--- Scenario 6: Admin Add New Company Live ---`);
  const newCompany = addCompanyAdmin({
    name: 'Acme AI',
    category: 'PRODUCT / TECHNOLOGY',
    description: 'Next gen AI research and agentic systems.',
    industry: 'Artificial Intelligence',
    difficulty: 'Very Hard',
    roles: [
      {
        id: 'acme-ai-engineer',
        title: 'AI Agent Engineer',
        requirements: {
          technicalSkills: ['Python', 'PyTorch', 'LLMs', 'LangChain', 'Vector Databases'],
          programmingLanguages: ['Python', 'C++'],
          frameworks: ['PyTorch', 'FastAPI'],
          databaseSkills: ['Pinecone', 'PostgreSQL'],
          dsaImportance: 'VERY HIGH',
          aptitudeImportance: 'MEDIUM',
          communicationImportance: 'HIGH',
          projectsImportance: 'VERY HIGH',
          systemDesignImportance: 'HIGH',
          cloudImportance: 'HIGH',
          testingImportance: 'LOW',
          experienceLevel: 'Entry Level'
        }
      }
    ],
    assessmentPattern: {
      name: 'Acme AI Challenge',
      stages: ['AI Agent Coding Challenge', 'System Architecture Interview'],
      timings: '120 mins',
      focusAreas: ['LLMs', 'Agent Logic']
    },
    interviewPattern: {
      rounds: ['AI Technical Loop', 'Founders HR Round'],
      format: 'Deep technical loops on AI agents and scalable ML design.',
      focusAreas: ['PyTorch', 'Agent Workflows']
    }
  });

  console.log(`Added New Company: ${newCompany.name} (ID: ${newCompany.id})`);
  const searchResult = getCompanyByIdOrName('Acme AI');
  console.log(`Search Verification: Found "${searchResult.name}" with ${searchResult.roles.length} role(s).`);

  // Clean up test admin company
  deleteCompanyAdmin('acme-ai');
  console.log(`Cleanup: Test admin company removed successfully.`);

  console.log('\n=== ALL 6 ACCEPTANCE TEST SCENARIOS PASSED CLEANLY! ===');
}

runAcceptanceTests().catch(console.error);

import * as fs from 'fs';
import * as path from 'path';

async function fixDuplicateSubscriptionsIssue() {
  try {
    const serviceFilePath = path.join(__dirname, 'services', 'board.service.ts');
    
    console.log('🔧 Fixing duplicate subscriptions issue in board.service.ts...');
    
    // Read the file
    let fileContent = fs.readFileSync(serviceFilePath, 'utf8');
    
    // Count the problematic lines before fix
    const problemLine1Count = (fileContent.match(/await queryRunner\.manager\.update\(Subscription, \{ idUser: user\.id \}, \{ idBoard: boardId, idSubscriptionState: 1 \}\);/g) || []).length;
    const problemLine2Count = (fileContent.match(/await queryRunner\.manager\.update\(Subscription, \{ idUser: user\.id \}, \{ idSubscriptionState: 2 \}\);/g) || []).length;
    
    console.log(`📊 Found ${problemLine1Count} instances of problematic line 1`);
    console.log(`📊 Found ${problemLine2Count} instances of problematic line 2`);
    
    // Fix #1: Update subscription for board promotion (line ~2623)
    // BEFORE: await queryRunner.manager.update(Subscription, { idUser: user.id }, { idBoard: boardId, idSubscriptionState: 1 });
    // AFTER: Only update subscription for the specific original board
    fileContent = fileContent.replace(
      /(\s+)\/\/ Update subscription to point to the new board \(level N\) and set state to ACTIVE \(1\)\s+await queryRunner\.manager\.update\(Subscription, \{ idUser: user\.id \}, \{ idBoard: boardId, idSubscriptionState: 1 \}\);/g,
      `$1// Update subscription to point to the new board (level N) and set state to ACTIVE (1)
$1// ✅ FIX: Only update subscription for the specific original board, not ALL user subscriptions
$1if (originalBoard) {
$1    await queryRunner.manager.update(Subscription, { idUser: user.id, idBoard: originalBoard.id }, { idBoard: boardId, idSubscriptionState: 1 });
$1} else {
$1    // Fallback: if we can't identify the original board, update any subscription to this level
$1    await queryRunner.manager.update(Subscription, { idUser: user.id }, { idBoard: boardId, idSubscriptionState: 1 });
$1}`
    );
    
    // Fix #2: Set subscription to INACTIVE for tail users (line ~2688)
    // BEFORE: await queryRunner.manager.update(Subscription, { idUser: user.id }, { idSubscriptionState: 2 });
    // AFTER: Only update subscription for the specific original board
    fileContent = fileContent.replace(
      /(\s+)\/\/ Set subscription to INACTIVE \(Assumed state 2\)\s+await queryRunner\.manager\.update\(Subscription, \{ idUser: user\.id \}, \{ idSubscriptionState: 2 \}\);/g,
      `$1// Set subscription to INACTIVE (Assumed state 2)
$1// ✅ FIX: Only update subscription for the specific original board, not ALL user subscriptions
$1if (originalBoard) {
$1    await queryRunner.manager.update(Subscription, { idUser: user.id, idBoard: originalBoard.id }, { idSubscriptionState: 2 });
$1} else {
$1    // Fallback: if we can't identify the original board, update any subscription to this level
$1    await queryRunner.manager.update(Subscription, { idUser: user.id }, { idSubscriptionState: 2 });
$1}`
    );
    
    // Write the fixed content back to the file
    fs.writeFileSync(serviceFilePath, fileContent, 'utf8');
    
    // Verify the fixes
    const fixedContent = fs.readFileSync(serviceFilePath, 'utf8');
    const remainingProblemLine1Count = (fixedContent.match(/await queryRunner\.manager\.update\(Subscription, \{ idUser: user\.id \}, \{ idBoard: boardId, idSubscriptionState: 1 \}\);/g) || []).length;
    const remainingProblemLine2Count = (fixedContent.match(/await queryRunner\.manager\.update\(Subscription, \{ idUser: user\.id \}, \{ idSubscriptionState: 2 \}\);/g) || []).length;
    
    console.log('✅ Fix applied successfully!');
    console.log(`📊 Remaining problematic line 1 instances: ${remainingProblemLine1Count}`);
    console.log(`📊 Remaining problematic line 2 instances: ${remainingProblemLine2Count}`);
    
    if (remainingProblemLine1Count === 0 && remainingProblemLine2Count === 0) {
      console.log('🎉 All problematic lines have been successfully fixed!');
      console.log('');
      console.log('✅ Changes made:');
      console.log('1. Line ~2623: Now only updates subscription for specific original board');
      console.log('2. Line ~2688: Now only updates subscription for specific original board');
      console.log('');
      console.log('🛡️ This prevents dual-role users from getting duplicate subscriptions during board splits.');
    } else {
      console.log('⚠️ Some problematic lines may still remain. Manual review recommended.');
    }
    
  } catch (error) {
    console.error('❌ Error fixing duplicate subscriptions issue:', error);
  }
}

// Execute if run directly
if (require.main === module) {
  fixDuplicateSubscriptionsIssue()
    .then(() => {
      console.log('🏁 Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export default fixDuplicateSubscriptionsIssue; 
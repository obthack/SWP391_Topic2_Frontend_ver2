/**
 * CLEAR DEMO MODE
 * 
 * Copy và paste script này vào Console (F12) để xóa Demo Mode
 */

(function () {
    console.log('🧹 Cleaning up Demo Mode...\n');

    // Remove demo mode from localStorage
    const hadDemoMode = localStorage.getItem('evtb_demo_mode');

    if (hadDemoMode) {
        localStorage.removeItem('evtb_demo_mode');
        console.log('✅ Removed demo_mode from localStorage');
    } else {
        console.log('✅ No demo_mode found (already clean)');
    }

    console.log('\n✨ Demo Mode has been removed from the application!');
    console.log('🔄 Reloading page in 2 seconds...\n');

    setTimeout(() => {
        location.reload();
    }, 2000);
})();




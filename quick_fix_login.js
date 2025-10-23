/**
 * QUICK FIX LOGIN ISSUE
 * 
 * Copy toàn bộ file này và paste vào Console (F12) trong browser
 * Hoặc chạy: node quick_fix_login.js (nếu dùng node)
 */

(function () {
    console.log('🔧 Starting Quick Fix for Login Issue...\n');

    // Step 1: Check current auth status
    console.log('📊 Step 1: Checking current auth status...');
    const authData = localStorage.getItem('evtb_auth');

    if (authData) {
        try {
            const parsed = JSON.parse(authData);
            console.log('✅ Found auth data in localStorage');
            console.log('   - Has token:', !!parsed?.token);
            console.log('   - Token length:', parsed?.token?.length || 0);
            console.log('   - Has user:', !!parsed?.user);

            if (parsed?.token) {
                // Check if token is expired
                try {
                    const payload = JSON.parse(atob(parsed.token.split('.')[1]));
                    const exp = payload.exp;
                    const now = Math.floor(Date.now() / 1000);
                    const isExpired = exp < now;

                    console.log('   - Token expired:', isExpired ? '❌ YES' : '✅ NO');

                    if (isExpired) {
                        const minutesAgo = Math.floor((now - exp) / 60);
                        console.log(`   - Expired ${minutesAgo} minutes ago`);
                    } else {
                        const timeLeft = exp - now;
                        const hours = Math.floor(timeLeft / 3600);
                        const minutes = Math.floor((timeLeft % 3600) / 60);
                        console.log(`   - Time left: ${hours}h ${minutes}m`);
                    }
                } catch (e) {
                    console.error('   ⚠️ Cannot parse token:', e.message);
                }
            }
        } catch (e) {
            console.error('❌ Corrupted auth data:', e.message);
        }
    } else {
        console.log('✅ No auth data found (clean state)');
    }

    console.log('\n');

    // Step 2: Clear old auth data
    console.log('🗑️  Step 2: Clearing old auth data...');

    let cleared = [];

    // Clear main auth data
    if (localStorage.getItem('evtb_auth')) {
        localStorage.removeItem('evtb_auth');
        cleared.push('evtb_auth');
    }

    // Clear demo mode
    if (localStorage.getItem('evtb_demo_mode')) {
        localStorage.removeItem('evtb_demo_mode');
        cleared.push('evtb_demo_mode');
    }

    // Clear any other auth-related data
    Object.keys(localStorage).forEach(key => {
        if (key.includes('auth') || key.includes('token')) {
            localStorage.removeItem(key);
            cleared.push(key);
        }
    });

    if (cleared.length > 0) {
        console.log('✅ Cleared:', cleared.join(', '));
    } else {
        console.log('✅ Nothing to clear (already clean)');
    }

    console.log('\n');

    // Step 3: Verify clean state
    console.log('✅ Step 3: Verifying clean state...');
    const afterClear = localStorage.getItem('evtb_auth');

    if (!afterClear) {
        console.log('✅ Auth data successfully cleared!');
    } else {
        console.error('❌ Auth data still exists! Manual intervention needed.');
    }

    console.log('\n');

    // Step 4: Instructions
    console.log('📝 Step 4: Next steps:');
    console.log('   1. ✅ Token cũ đã được xóa');
    console.log('   2. 🔄 Reload trang web (F5 hoặc Ctrl+R)');
    console.log('   3. 🔐 Đăng nhập lại với email/password');
    console.log('   4. ✨ Hoàn tất!');

    console.log('\n');
    console.log('💡 Tips:');
    console.log('   - Nếu vẫn lỗi, check backend có running không');
    console.log('   - Check Network tab (F12) xem API calls');
    console.log('   - Endpoint login: /api/User/login');

    console.log('\n');
    console.log('🎯 Auto-reloading in 3 seconds...');

    // Auto reload after 3 seconds
    setTimeout(() => {
        console.log('🔄 Reloading...');
        location.reload();
    }, 3000);

    // Return cleanup function in case user wants to cancel
    return {
        cancel: () => {
            console.log('❌ Auto-reload cancelled');
        },
        manualReload: () => {
            location.reload();
        },
        checkStatus: () => {
            const current = localStorage.getItem('evtb_auth');
            if (current) {
                console.log('⚠️ Auth data exists');
                try {
                    console.log(JSON.parse(current));
                } catch (e) {
                    console.log('❌ Corrupted data');
                }
            } else {
                console.log('✅ Clean state - ready to login');
            }
        }
    };
})();




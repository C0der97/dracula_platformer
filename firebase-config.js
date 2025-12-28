// Firebase configuration and analytics initialization
// Import Firebase modules from CDN (loaded via script tags in HTML)

const firebaseConfig = {
    apiKey: "AIzaSyCbp-rRA5dNNuV6f9DbBOjFYcdPB4ZkRO0",
    authDomain: "juegos-e014d.firebaseapp.com",
    projectId: "juegos-e014d",
    storageBucket: "juegos-e014d.firebasestorage.app",
    messagingSenderId: "590427535582",
    appId: "1:590427535582:web:af5a625a12e844398d2a4f",
    measurementId: "G-YQ0MXP28RB"
};

// Initialize Firebase
let app = null;
let analytics = null;

function initializeFirebase() {
    try {
        // Check if Firebase is available (loaded from CDN)
        if (typeof firebase !== 'undefined') {
            app = firebase.initializeApp(firebaseConfig);
            analytics = firebase.analytics();
            console.log('✅ Firebase Analytics initialized successfully');
        } else {
            console.warn('⚠️ Firebase SDK not loaded');
        }
    } catch (error) {
        console.error('❌ Error initializing Firebase:', error);
    }
}

// Custom analytics events for the game
const GameAnalytics = {
    // Track when the game starts
    logGameStart: function () {
        if (analytics) {
            firebase.analytics().logEvent('game_start', {
                game_name: 'dracula_platformer'
            });
            console.log('📊 Event logged: game_start');
        }
    },

    // Track when a game ends
    logGameEnd: function (score, result) {
        if (analytics) {
            firebase.analytics().logEvent('game_end', {
                game_name: 'dracula_platformer',
                score: score,
                result: result // 'victory' or 'game_over'
            });
            console.log('📊 Event logged: game_end', { score, result });
        }
    },

    // Track score milestones
    logScoreMilestone: function (score) {
        if (analytics) {
            firebase.analytics().logEvent('score_milestone', {
                game_name: 'dracula_platformer',
                score: score
            });
            console.log('📊 Event logged: score_milestone', score);
        }
    },

    // Track enemy defeats
    logEnemyDefeated: function (enemyType) {
        if (analytics) {
            firebase.analytics().logEvent('enemy_defeated', {
                game_name: 'dracula_platformer',
                enemy_type: enemyType
            });
        }
    },

    // Track achievements unlocked
    logAchievementUnlocked: function (achievementName) {
        if (analytics) {
            firebase.analytics().logEvent('unlock_achievement', {
                achievement_id: achievementName
            });
            console.log('📊 Event logged: achievement_unlocked', achievementName);
        }
    },

    // Track screen/page views
    logScreenView: function (screenName) {
        if (analytics) {
            firebase.analytics().logEvent('screen_view', {
                screen_name: screenName
            });
        }
    }
};

// Initialize Firebase when the script loads
document.addEventListener('DOMContentLoaded', initializeFirebase);

// Make GameAnalytics available globally
window.GameAnalytics = GameAnalytics;

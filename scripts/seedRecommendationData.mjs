#!/usr/bin/env node

import dotenv from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

dotenv.config({ path: '.env.local', quiet: true });

const SEED_PASSWORD = process.env.SEED_TEST_PASSWORD || 'AraeTest123!';
const SUPER_ADMIN_EMAIL = process.env.SEED_SUPER_ADMIN_EMAIL || 'moderatemamba@gmail.com';
const SEED_DATE = process.env.SEED_DATE ? new Date(process.env.SEED_DATE) : new Date();
const SEED_MARKER = 'recommendation-engine-seed-v1';
const DAY_MS = 24 * 60 * 60 * 1000;

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is required in .env.local to seed Firebase with admin access.');
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
}

const auth = getAuth();
const db = getFirestore();

const users = [
    {
        label: 'P1',
        uid: 'seed_p1_cold_start',
        email: 'arae.seed.p1@example.com',
        displayName: 'P1 Cold Start Student',
        interest: [],
        purpose: 'Cold-start profile',
        age: 16,
    },
    {
        label: 'P2',
        uid: 'seed_p2_declared_only',
        email: 'arae.seed.p2@example.com',
        displayName: 'P2 Declared Interests Only',
        interest: ['Mathematics', 'Science'],
        purpose: 'Declared interests, no history',
        age: 17,
    },
    {
        label: 'P3',
        uid: 'seed_p3_high_performer',
        email: 'arae.seed.p3@example.com',
        displayName: 'P3 High Performer',
        interest: ['Mathematics', 'Science'],
        purpose: 'High performer',
        age: 18,
    },
    {
        label: 'P4',
        uid: 'seed_p4_foundation_builder',
        email: 'arae.seed.p4@example.com',
        displayName: 'P4 Foundation Builder',
        interest: ['Mathematics', 'Science'],
        purpose: 'Low performer',
        age: 15,
    },
    {
        label: 'P5',
        uid: 'seed_p5_implicit_only',
        email: 'arae.seed.p5@example.com',
        displayName: 'P5 Implicit Interests Only',
        interest: [],
        purpose: 'Implicit interests only',
        age: 19,
    },
    {
        label: 'F1',
        uid: 'seed_f1_math_peer',
        email: 'arae.seed.f1@example.com',
        displayName: 'F1 Mathematics Peer',
        interest: ['Mathematics'],
        purpose: 'Cohort padding',
        age: 16,
    },
    {
        label: 'F2',
        uid: 'seed_f2_science_tech_peer',
        email: 'arae.seed.f2@example.com',
        displayName: 'F2 Science Technology Peer',
        interest: ['Science', 'Technology'],
        purpose: 'Cohort padding',
        age: 17,
    },
    {
        label: 'F3',
        uid: 'seed_f3_language_tech_peer',
        email: 'arae.seed.f3@example.com',
        displayName: 'F3 Language Technology Peer',
        interest: ['Language', 'Technology'],
        purpose: 'Cohort padding',
        age: 18,
    },
];

const programs = [
    {
        no: 1,
        title: 'A-Level Maths Series - Pure Mathematics',
        category: ['Mathematics'],
        episodeCount: 15,
        quizCount: 6,
        ageDays: 90,
        description: 'A structured pure mathematics revision path with concepts, examples, and checkpoint assessments.',
    },
    {
        no: 2,
        title: 'Class 10 Mathematics',
        category: ['Mathematics'],
        episodeCount: 15,
        quizCount: 6,
        ageDays: 45,
        description: 'Class 10 mathematics practice covering algebra, geometry, and exam-style problem solving.',
    },
    {
        no: 3,
        title: 'Mathematics Class 1',
        category: ['Mathematics'],
        episodeCount: 15,
        quizCount: 1,
        ageDays: 180,
        description: 'Foundational mathematics for younger learners with short lessons and one final assessment.',
    },
    {
        no: 4,
        title: 'All of AS & A-level Physics',
        category: ['Science'],
        episodeCount: 15,
        quizCount: 7,
        ageDays: 30,
        description: 'A broad AS and A-level physics sequence with frequent assessment-led checkpoints.',
    },
    {
        no: 5,
        title: 'A-Level Chemistry: Organic Foundations',
        category: ['Science'],
        episodeCount: 12,
        quizCount: 5,
        ageDays: 12,
        description: 'Organic chemistry foundations for A-level students, balancing lessons with practical quizzes.',
    },
    {
        no: 6,
        title: 'GCSE Biology: Cells and Systems',
        category: ['Science'],
        episodeCount: 10,
        quizCount: 6,
        ageDays: 60,
        description: 'GCSE biology concepts on cells, organ systems, and applied scientific reasoning.',
    },
    {
        no: 7,
        title: "A' Level English Language",
        category: ['Language'],
        episodeCount: 9,
        quizCount: 2,
        ageDays: 120,
        description: 'English language analysis and writing practice for A-level learners.',
    },
    {
        no: 8,
        title: 'Academic Writing for University',
        category: ['Language'],
        episodeCount: 8,
        quizCount: 2,
        ageDays: 5,
        description: 'Academic writing essentials covering argument, structure, citation, and revision habits.',
    },
    {
        no: 9,
        title: 'Mandarin for Beginners',
        category: ['Language'],
        episodeCount: 12,
        quizCount: 1,
        ageDays: 270,
        description: 'An introductory Mandarin course focused on everyday phrases, tones, and basic vocabulary.',
    },
    {
        no: 10,
        title: 'Introduction to Python Programming',
        category: ['Technology'],
        episodeCount: 14,
        quizCount: 6,
        ageDays: 2,
        description: 'Python fundamentals with hands-on exercises, quizzes, and small coding challenges.',
    },
    {
        no: 11,
        title: 'Web Development Fundamentals',
        category: ['Technology'],
        episodeCount: 16,
        quizCount: 4,
        ageDays: 365,
        description: 'A beginner-friendly web development path covering HTML, CSS, JavaScript, and deployment basics.',
    },
    {
        no: 12,
        title: 'Data Literacy and Spreadsheets',
        category: ['Technology'],
        episodeCount: 10,
        quizCount: 1,
        ageDays: 75,
        description: 'Data literacy, spreadsheet formulas, and chart interpretation for everyday analysis.',
    },
    {
        no: 13,
        title: '52 Essential Life Skills',
        category: ['Health'],
        episodeCount: 15,
        quizCount: 1,
        ageDays: 20,
        description: 'Practical life skills for independent learning, wellbeing, decision making, and self-management.',
    },
    {
        no: 14,
        title: 'Climate Science Basics',
        category: ['Environment'],
        episodeCount: 9,
        quizCount: 2,
        ageDays: 150,
        description: 'Climate science basics covering systems, evidence, impacts, and everyday sustainability choices.',
    },
];

const enrollments = {
    1: ['P3', 'P4', 'F1', 'F2'],
    2: ['P3', 'P4', 'F1'],
    3: ['F3'],
    4: ['P3', 'P4', 'F1', 'F2', 'F3'],
    5: ['P3', 'F2'],
    6: ['P4', 'F1', 'F2'],
    7: ['P5', 'F3'],
    8: ['P5', 'F3', 'F1'],
    9: ['P5'],
    10: ['P5', 'F2', 'F3'],
    11: ['F2', 'F3'],
    12: ['P5', 'F3'],
    13: ['P4', 'F1', 'F2', 'F3'],
    14: [],
};

const completionPlans = {
    P3: { full: [1, 2, 4], partial: [5] },
    P4: { full: [1, 4, 13], partial: [2, 6] },
    P5: { full: [7, 10], partial: [8, 9, 12] },
    F1: { full: [1], partial: [2, 4, 8, 13] },
    F2: { full: [4], partial: [1, 5, 6, 10, 11, 13] },
    F3: { full: [10], partial: [3, 4, 7, 8, 11, 12, 13] },
};

const quizMeans = {
    P3: { Mathematics: 88, Science: 85 },
    P4: { Mathematics: 42, Science: 45, Health: 47 },
    P5: { Technology: 70, Language: 65 },
    F1: { Mathematics: 60, Science: 58, Language: 61, Health: 57 },
    F2: { Mathematics: 72, Science: 68, Technology: 75, Health: 70 },
    F3: { Mathematics: 55, Language: 62, Technology: 58, Science: 56, Health: 59 },
};

function normalizeTitle(title) {
    return String(title || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function slugify(value) {
    return String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 48);
}

function daysAgo(days) {
    return Timestamp.fromDate(new Date(SEED_DATE.getTime() - days * DAY_MS));
}

function addDays(date, days) {
    return new Date(date.getTime() + days * DAY_MS);
}

function quizIndexesFor(episodeCount, quizCount) {
    const indexes = new Set();
    if (quizCount <= 0) return indexes;

    for (let quizNo = 1; quizNo <= quizCount; quizNo++) {
        let index = Math.round((quizNo * (episodeCount + 1)) / (quizCount + 1)) - 1;
        index = Math.max(0, Math.min(episodeCount - 1, index));

        while (indexes.has(index) && index < episodeCount - 1) {
            index++;
        }
        while (indexes.has(index) && index > 0) {
            index--;
        }
        indexes.add(index);
    }

    return indexes;
}

function buildEpisodes(program) {
    const quizIndexes = quizIndexesFor(program.episodeCount, program.quizCount);
    let lessonNo = 1;
    let quizNo = 1;

    return Array.from({ length: program.episodeCount }, (_, index) => {
        if (quizIndexes.has(index)) {
            const currentQuizNo = quizNo++;
            return {
                title: `Assessment ${currentQuizNo}: ${program.category[0]} checkpoint`,
                description: `Short scored checkpoint for ${program.title}.`,
                order: index,
                duration: 12,
                type: 'quiz',
                questions: [
                    {
                        id: `${program.no}-${index}-q1`,
                        type: 'multiple_choice',
                        text: `Which option best matches the key idea from ${program.title}?`,
                        options: ['Review the concept', 'Skip the concept', 'Ignore feedback', 'Guess randomly'],
                        correctOption: 0,
                    },
                    {
                        id: `${program.no}-${index}-q2`,
                        type: 'multiple_choice',
                        text: `What should a learner do after completing this ${program.category[0]} checkpoint?`,
                        options: ['Reflect on errors', 'Delete progress', 'Avoid practice', 'Stop learning'],
                        correctOption: 0,
                    },
                ],
            };
        }

        const currentLessonNo = lessonNo++;
        return {
            title: `Lesson ${currentLessonNo}: ${program.category[0]} concept builder`,
            description: `Guided learning material for ${program.title}.`,
            content: `Dummy lesson content for ${program.title}, episode ${index + 1}.`,
            order: index,
            duration: 18,
            type: 'video',
        };
    });
}

function completedEpisodeIndexes(program, completionType) {
    if (completionType === 'full') {
        return Array.from({ length: program.episodeCount }, (_, index) => String(index));
    }

    const count = Math.max(1, Math.ceil(program.episodeCount / 2));
    return Array.from({ length: count }, (_, index) => String(index));
}

function completionTypeFor(label, programNo) {
    const plan = completionPlans[label];
    if (!plan) return 'partial';
    if (plan.full.includes(programNo)) return 'full';
    if (plan.partial.includes(programNo)) return 'partial';
    return 'partial';
}

function quizScoreFor(label, category, sequence) {
    const categoryMeans = quizMeans[label] || {};
    const base = categoryMeans[category];
    if (base == null) return null;

    const offsets = [-4, 3, -1, 5, -3, 2, 0, 4, -2, 1, -5, 3];
    const score = Math.max(0, Math.min(100, Math.round(base + offsets[sequence % offsets.length])));
    return {
        score,
        total: 100,
        answers: {
            q1: 0,
            q2: sequence % 2 === 0 ? 0 : 1,
        },
        totalPoints: score,
        firstScore: score,
        firstTotalPoints: score,
        timePerQuestion: {
            q1: 18 + (sequence % 5),
            q2: 20 + (sequence % 7),
        },
        timestamp: Timestamp.fromDate(new Date(SEED_DATE.getTime() - (sequence + 1) * 60 * 60 * 1000)),
    };
}

function buildProgress(label, program, programId) {
    const completionType = completionTypeFor(label, program.no);
    const completedEpisodes = completedEpisodeIndexes(program, completionType);
    const completedSet = new Set(completedEpisodes);
    const quizIndexes = quizIndexesFor(program.episodeCount, program.quizCount);
    const quizScores = {};
    let sequence = program.no;

    for (const index of quizIndexes) {
        if (!completedSet.has(String(index))) continue;
        const score = quizScoreFor(label, program.category[0], sequence++);
        if (score) {
            quizScores[String(index)] = score;
        }
    }

    const isFull = completionType === 'full';
    return {
        userId: usersByLabel.get(label).uid,
        programId,
        completedEpisodes,
        quizScores,
        pointsClaimed: isFull,
        claimedAt: isFull ? Timestamp.fromDate(new Date(SEED_DATE.getTime() - program.no * 60 * 60 * 1000)) : null,
        lastUpdated: Timestamp.fromDate(new Date(SEED_DATE.getTime() - (program.no + 1) * 60 * 60 * 1000)),
        seededBy: SEED_MARKER,
    };
}

async function upsertAuthUser(user) {
    try {
        await auth.updateUser(user.uid, {
            email: user.email,
            password: SEED_PASSWORD,
            displayName: user.displayName,
            emailVerified: true,
            disabled: false,
        });
        return { uid: user.uid, status: 'updated' };
    } catch (error) {
        if (error?.code !== 'auth/user-not-found') {
            if (error?.code === 'auth/email-already-exists') {
                const existing = await auth.getUserByEmail(user.email);
                return { uid: existing.uid, status: 'email-exists' };
            }
            throw error;
        }
    }

    await auth.createUser({
        uid: user.uid,
        email: user.email,
        password: SEED_PASSWORD,
        displayName: user.displayName,
        emailVerified: true,
        disabled: false,
    });

    return { uid: user.uid, status: 'created' };
}

async function ensureSuperAdmin() {
    let adminUid = null;
    let source = 'missing';

    try {
        const authUser = await auth.getUserByEmail(SUPER_ADMIN_EMAIL);
        adminUid = authUser.uid;
        source = 'auth';
    } catch {
        const existing = await db.collection('users').where('email', '==', SUPER_ADMIN_EMAIL).limit(1).get();
        if (!existing.empty) {
            adminUid = existing.docs[0].id;
            source = 'firestore';
        }
    }

    if (!adminUid) {
        console.warn(`Super admin email not found in Auth or Firestore: ${SUPER_ADMIN_EMAIL}`);
        return { uid: 'seed_super_admin_fallback', ref: db.collection('users').doc('seed_super_admin_fallback'), source };
    }

    const adminRef = db.collection('users').doc(adminUid);
    const existingDoc = await adminRef.get();
    const existing = existingDoc.exists ? existingDoc.data() : {};

    await adminRef.set(
        {
            uid: adminUid,
            email: SUPER_ADMIN_EMAIL,
            displayName: existing?.displayName || 'Super Admin',
            photoUrl: existing?.photoUrl || '',
            phoneNumber: existing?.phoneNumber || '',
            phoneNumberDialCode: existing?.phoneNumberDialCode || '',
            createdTime: existing?.createdTime || Timestamp.now(),
            editedTime: Timestamp.now(),
            role: 'admin',
            gender: existing?.gender || '',
            age: existing?.age || 0,
            interest: existing?.interest || [],
            schoolName: existing?.schoolName || '',
            schoolRef: existing?.schoolRef || '',
            countryRef: existing?.countryRef || '',
            stateRef: existing?.stateRef || '',
            postcode: existing?.postcode || 0,
            isOrganisation: true,
            isSuperAdmin: true,
            isSubAdmin: false,
            joinedEventNumber: existing?.joinedEventNumber || 0,
            joinedEventRef: existing?.joinedEventRef || [],
            points: existing?.points || 0,
            seededBy: SEED_MARKER,
        },
        { merge: true }
    );

    return { uid: adminUid, ref: adminRef, source };
}

async function archiveTestPrograms() {
    const snapshot = await db.collection('event').get();
    const archived = [];

    for (const doc of snapshot.docs) {
        if (normalizeTitle(doc.get('title')) === 'test') {
            await doc.ref.set(
                {
                    archived: true,
                    editedTime: Timestamp.now(),
                    seededBy: SEED_MARKER,
                },
                { merge: true }
            );
            archived.push(doc.id);
        }
    }

    return archived;
}

async function upsertPrograms(createdByRef) {
    const snapshot = await db.collection('event').get();
    const byTitle = new Map(snapshot.docs.map((doc) => [normalizeTitle(doc.get('title')), doc]));
    const refsByNo = new Map();
    const idByNo = new Map();
    const results = [];

    for (const program of programs) {
        const existing = byTitle.get(normalizeTitle(program.title));
        const docId = existing?.id || `recommendation_seed_${String(program.no).padStart(2, '0')}_${slugify(program.title)}`;
        const ref = existing?.ref || db.collection('event').doc(docId);
        const current = existing?.data() || {};
        const createdTime = daysAgo(program.ageDays);
        const startDate = createdTime;
        const endDate = Timestamp.fromDate(addDays(createdTime.toDate(), 30));

        await ref.set(
            {
                title: program.title,
                description: program.description,
                image: current.image || '',
                type: 'online',
                access: 'public',
                isLocked: false,
                mode: 'online',
                approach: 'self-paced',
                archived: false,
                startDate: startDate.toDate().toISOString().slice(0, 10),
                startTime: '09:00',
                endDate: endDate.toDate().toISOString().slice(0, 10),
                endTime: '17:00',
                createdTime,
                editedTime: Timestamp.now(),
                createdBy: createdByRef,
                whoCreated: true,
                privateAccess: [],
                video: current.video || {},
                episode: buildEpisodes(program),
                resources: current.resources || [],
                date: {
                    startDate,
                    endDate,
                    timeZone: 'Asia/Kuala_Lumpur',
                },
                duration: program.episodeCount * 20,
                location: current.location || {},
                attachement: current.attachement || {},
                category: program.category,
                audience: ['Students', 'Everyone'],
                rewardPoints: program.episodeCount * 10,
                background: current.background || '',
                seededBy: SEED_MARKER,
                recommendationSeedNo: program.no,
            },
            { merge: true }
        );

        refsByNo.set(program.no, ref);
        idByNo.set(program.no, ref.id);
        results.push({ no: program.no, id: ref.id, title: program.title, action: existing ? 'updated' : 'created' });
    }

    return { refsByNo, idByNo, results };
}

async function upsertUsers(programRefsByNo) {
    const authResults = [];

    for (const user of users) {
        const authResult = await upsertAuthUser(user);
        user.uid = authResult.uid;
        authResults.push({ label: user.label, uid: user.uid, email: user.email, auth: authResult.status });
    }

    for (const user of users) {
        const joinedProgramNos = Object.entries(enrollments)
            .filter(([, labels]) => labels.includes(user.label))
            .map(([programNo]) => Number(programNo));

        const joinedEventRef = joinedProgramNos.map((programNo) => programRefsByNo.get(programNo));
        const completedFullNos = completionPlans[user.label]?.full || [];
        const points = completedFullNos.reduce((sum, programNo) => {
            const program = programs.find((item) => item.no === programNo);
            return sum + (program ? program.episodeCount * 10 : 0);
        }, 0);

        await db.collection('users').doc(user.uid).set(
            {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoUrl: '',
                phoneNumber: '',
                phoneNumberDialCode: '',
                createdTime: daysAgo(420 - user.age),
                editedTime: Timestamp.now(),
                lastActiveTime: Timestamp.now(),
                role: 'student',
                gender: user.label.endsWith('1') || user.label.endsWith('3') ? 'female' : 'male',
                age: user.age,
                interest: user.interest,
                schoolName: 'ARAE Demo School',
                schoolRef: 'seed_school_arae_demo',
                countryRef: 'Malaysia',
                stateRef: 'Kuala Lumpur',
                postcode: 50000,
                isOrganisation: false,
                isSuperAdmin: false,
                isSubAdmin: false,
                joinedEventNumber: joinedEventRef.length,
                joinedEventRef,
                points,
                joinedFoldersRef: [],
                joinedFoldersNumber: 0,
                seededBy: SEED_MARKER,
                recommendationProfile: user.label,
                recommendationProfilePurpose: user.purpose,
            },
            { merge: true }
        );
    }

    return authResults;
}

async function writeEnrollments(programRefsByNo) {
    const results = [];

    for (const program of programs) {
        const labels = enrollments[program.no] || [];
        const joinedRefs = labels.map((label) => db.collection('users').doc(usersByLabel.get(label).uid));
        const joinedUids = labels.map((label) => usersByLabel.get(label).uid);
        const ref = programRefsByNo.get(program.no);

        await ref.set(
            {
                joined: joinedRefs,
                userJoined: joinedUids,
                userJoinedNumber: joinedUids.length,
                editedTime: Timestamp.now(),
                seededBy: SEED_MARKER,
            },
            { merge: true }
        );

        results.push({ no: program.no, title: program.title, count: joinedUids.length });
    }

    return results;
}

async function upsertProgress(programIdsByNo) {
    const results = [];

    for (const [programNoString, labels] of Object.entries(enrollments)) {
        const programNo = Number(programNoString);
        const program = programs.find((item) => item.no === programNo);
        const programId = programIdsByNo.get(programNo);

        for (const label of labels) {
            const user = usersByLabel.get(label);
            const progress = buildProgress(label, program, programId);
            const progressId = `${user.uid}_${programId}`;

            await db.collection('user_program_progress').doc(progressId).set(progress, { merge: true });
            results.push({ id: progressId, user: label, program: programNo, completed: progress.completedEpisodes.length });
        }
    }

    return results;
}

async function verifySeed(programIdsByNo) {
    const checks = [];

    for (const user of users) {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const progressSnap = await db.collection('user_program_progress').where('userId', '==', user.uid).get();
        checks.push({
            label: user.label,
            uid: user.uid,
            interests: userDoc.get('interest') || [],
            joinedEventNumber: userDoc.get('joinedEventNumber') || 0,
            progressDocs: progressSnap.size,
        });
    }

    const programChecks = [];
    for (const program of programs) {
        const doc = await db.collection('event').doc(programIdsByNo.get(program.no)).get();
        programChecks.push({
            no: program.no,
            title: doc.get('title'),
            category: doc.get('category'),
            joinedCount: doc.get('userJoinedNumber') || 0,
            episodes: doc.get('episode')?.length || 0,
        });
    }

    return { users: checks, programs: programChecks };
}

const usersByLabel = new Map(users.map((user) => [user.label, user]));

async function main() {
    console.log(`Seeding recommendation data into project: ${serviceAccount.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
    console.log(`Seed date: ${SEED_DATE.toISOString()}`);

    const superAdmin = await ensureSuperAdmin();
    console.log(`Super admin ensured: ${SUPER_ADMIN_EMAIL} (${superAdmin.source})`);

    const archivedTestPrograms = await archiveTestPrograms();
    if (archivedTestPrograms.length > 0) {
        console.log(`Archived Test program docs: ${archivedTestPrograms.join(', ')}`);
    }

    const { refsByNo, idByNo, results: programResults } = await upsertPrograms(superAdmin.ref);
    console.log(`Programs created/updated: ${programResults.length}`);

    const authResults = await upsertUsers(refsByNo);
    console.log(`Seed users created/updated in Auth and Firestore: ${authResults.length}`);

    const enrollmentResults = await writeEnrollments(refsByNo);
    console.log(`Enrollment matrix written for ${enrollmentResults.length} programs`);

    const progressResults = await upsertProgress(idByNo);
    console.log(`Progress documents written: ${progressResults.length}`);

    const verification = await verifySeed(idByNo);

    console.log('\nEvaluation profiles:');
    for (const result of authResults) {
        console.log(`- ${result.label}: ${result.email} / ${SEED_PASSWORD} / uid=${result.uid}`);
    }

    console.log('\nVerification summary:');
    console.log(JSON.stringify(verification, null, 2));
}

main().catch((error) => {
    console.error('Recommendation seed failed:');
    console.error(error);
    process.exit(1);
});

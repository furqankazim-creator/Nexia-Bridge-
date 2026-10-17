import { Child, ConsentGrant, Target, AuditEvent, MessageItem, ChatContact, AppNotification } from '../types';

export const INITIAL_CHILDREN: Child[] = [
  {
    id: 'child-lama',
    name: 'Lama Alharbi',
    age: 6,
    avatar: 'https://images.unsplash.com/photo-1595454223600-91fb57d22457?w=150&auto=format&fit=crop&q=80',
    diagnosis: 'Language Delay & Sensory-Motor Integration',
    caregivers: ['Sarah Alharbi (Mother)', 'Khaled Alharbi (Father)'],
    school: 'Riyadh Inclusive Academy',
    classroom: 'Grade 1 - Lavender Room',
    assignedTeam: [
      { role: 'speech', name: 'Dr. Sarah Alharbi', title: 'Speech-Language Pathologist (Lead SLP)' },
      { role: 'ot', name: 'Reem Al-Ahmad', title: 'Occupational Therapist (OT Specialist)' },
      { role: 'behavior', name: 'Dr. Tareq Hassan', title: 'Board Certified Behavior Analyst (BCBA)' },
      { role: 'teacher', name: 'Ms. Layla Fahad', title: 'Inclusive Classroom Teacher' },
      { role: 'supervisor', name: 'Dr. Rebecca Hall', title: 'Clinical Director' },
    ],
    todayProgress: [
      { area: 'Fine motor', status: 'Developing', reason: 'Fastening buttons and tripod pencil hold practice with adaptive grip.', score: 65, criterion: 80 },
      { area: 'Independent dressing', status: 'Developing', reason: 'Putting on sneakers and zipping sweater slider.', score: 60, criterion: 85 },
      { area: 'Attention', status: 'Improving', reason: 'Sustained focus in morning circle for 14 minutes.', score: 85, criterion: 75 },
    ],
    thisWeek: {
      whatWeWorkedOn: 'Answering WH questions in speech therapy, sensory regulation circuit, and independent dressing routines.',
      whatChildIsDoingWell: 'Met mastery criterion for requesting help across 3 sessions.',
      whatNeedsMorePractice: 'Fastening buttons and tripod pencil hold without adult cue.',
      howToPracticeAtHome: {
        title: 'Snack-Time WH Question Game',
        description: 'At snack time, ask a "what" or "where" question and wait 4 seconds before helping.',
        materials: ['Favorite healthy snack', 'Visual choice board'],
        videoDuration: '1:02',
        steps: [
          'Place snack in sight but just out of reach.',
          'Ask: "Where is the apple?" or "What do you want?"',
          'Wait 4 seconds for processing.',
          'If needed, gently point to the item.',
          'Praise immediately and give the snack!'
        ]
      }
    }
  },
  {
    id: 'child-2',
    name: 'Maya Al-Rashid',
    age: 5,
    avatar: 'https://images.unsplash.com/photo-1595454223600-91fb57d22457?w=150&auto=format&fit=crop&q=80',
    diagnosis: 'Developmental Language Delay, Sensory Processing',
    caregivers: ['Amira Al-Rashid (Mother)', 'Tariq Al-Rashid (Father)'],
    school: 'Al-Noor International Academy',
    classroom: 'Kindergarten Blue',
    assignedTeam: [
      { role: 'speech', name: 'Elena Vance', title: 'Speech-Language Pathologist' },
      { role: 'ot', name: 'Marcus Reed', title: 'Occupational Therapist' },
      { role: 'teacher', name: 'Noura Al-Hassan', title: 'Kindergarten Educator' },
      { role: 'supervisor', name: 'Dr. Rebecca Hall', title: 'Clinical Director' },
    ],
    todayProgress: [
      { area: 'Communication', status: 'Improving', reason: 'Expanded phrases to 3-word combinations using core vocabulary board.', score: 82, criterion: 85 },
      { area: 'Math', status: 'Mastered', reason: 'Consistently identifies shapes circles and squares across all settings.', score: 95, criterion: 90 },
      { area: 'Fine motor', status: 'Developing', reason: 'Practiced scissor control on 2-inch straight lines.', score: 70, criterion: 80 },
      { area: 'Independent dressing', status: 'Needs support', reason: 'Zipping jacket slider needs hand-over-hand alignment.', score: 45, criterion: 85 },
      { area: 'Attention', status: 'Improving', reason: 'Completed 8-minute sensory circuit before seated desk tasks.', score: 80, criterion: 75 },
    ],
    thisWeek: {
      whatWeWorkedOn: 'AAC vocabulary expansion for daily wants and gross motor balance beam walks.',
      whatChildIsDoingWell: 'Greeting classmates spontaneously using her communication device.',
      whatNeedsMorePractice: 'Bilateral hand coordination while holding paper and cutting.',
      howToPracticeAtHome: {
        title: 'Two-Hand Playdough Roll',
        description: 'Practice flattening and cutting playdough snakes using both hands together.',
        materials: ['Non-toxic playdough', 'Child-safe plastic plastic knife or ruler'],
        videoDuration: '0:55',
        steps: [
          'Roll playdough into a snake on the table together.',
          'Hold the left side with helper hand, cut pieces with right hand.',
          'Praise using both hands at the same time!'
        ]
      }
    }
  },
  {
    id: 'child-3',
    name: 'Tariq Al-Otaibi',
    age: 7,
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    diagnosis: 'ADHD (Combined Type), Dysgraphia',
    caregivers: ['Fahad Al-Otaibi (Father)', 'Laila Al-Otaibi (Mother)'],
    school: 'Riyadh Modern School',
    classroom: 'Grade 2 - Green',
    assignedTeam: [
      { role: 'behavior', name: 'Dr. Maya Lin', title: 'Lead BCBA' },
      { role: 'remedial', name: 'James Chen', title: 'Remedial Learning Specialist' },
      { role: 'ot', name: 'Marcus Reed', title: 'Occupational Therapist' },
      { role: 'teacher', name: 'Emma Watson', title: 'Grade 2 Teacher' },
      { role: 'supervisor', name: 'Dr. Rebecca Hall', title: 'Clinical Director' },
    ],
    todayProgress: [
      { area: 'Communication', status: 'Mastered', reason: 'Conversational turn-taking exceeds target criteria in classroom discussions.', score: 92, criterion: 85 },
      { area: 'Math', status: 'Improving', reason: 'Addition within 20 accuracy reached 88% with visual number line.', score: 88, criterion: 85 },
      { area: 'Fine motor', status: 'Developing', reason: 'Pencil grip angle maintained with silicone grip aid for 5 lines of text.', score: 72, criterion: 80 },
      { area: 'Independent dressing', status: 'Mastered', reason: 'Ties sneakers and manages backpack zippers without adult assistance.', score: 98, criterion: 90 },
      { area: 'Attention', status: 'Needs support', reason: 'Off-task behavior during unprompted seatwork transitions.', score: 55, criterion: 75 },
    ],
    thisWeek: {
      whatWeWorkedOn: 'Concrete-to-abstract math addition, self-monitoring token charts, and handwriting legibility.',
      whatChildIsDoingWell: 'Self-correcting errors during 1-minute timed math sprints.',
      whatNeedsMorePractice: 'Sustaining focus during silent reading without tapping pencils.',
      howToPracticeAtHome: {
        title: '5-Minute Math Beat-the-Clock',
        description: 'Fun short sprint using visual timer where Tariq beats his own previous record.',
        materials: ['Math flashcards 1-10', 'Visual sand timer (3 min)'],
        videoDuration: '1:10',
        steps: [
          'Set 3-minute visual timer on table.',
          'Child completes cards at their own pace without interruption.',
          'Count cards together and record the high score on the fridge chart!'
        ]
      }
    }
  }
];

export const INITIAL_CONSENT_GRANTS: ConsentGrant[] = [
  {
    id: 'grant-1',
    childId: 'child-lama',
    professionalId: 'prof-behavior',
    professionalName: 'Dr. Maya Lin',
    role: 'behavior',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    domains: {
      communication: true,
      math: true,
      fineMotor: true,
      dressing: true,
      attention: true,
      clinicalNotes: true,
    },
    expiryDate: '2027-10-31',
    lastViewed: 'Today at 2:15 PM'
  },
  {
    id: 'grant-2',
    childId: 'child-lama',
    professionalId: 'prof-speech',
    professionalName: 'Elena Vance',
    role: 'speech',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    domains: {
      communication: true,
      math: false,
      fineMotor: false,
      dressing: false,
      attention: true,
      clinicalNotes: true,
    },
    expiryDate: '2027-10-31',
    lastViewed: 'Today at 11:30 AM'
  },
  {
    id: 'grant-3',
    childId: 'child-lama',
    professionalId: 'prof-ot',
    professionalName: 'Marcus Reed',
    role: 'ot',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    domains: {
      communication: false,
      math: false,
      fineMotor: true,
      dressing: true,
      attention: true,
      clinicalNotes: true,
    },
    expiryDate: '2027-08-15',
    lastViewed: 'Yesterday at 3:45 PM'
  },
  {
    id: 'grant-4',
    childId: 'child-lama',
    professionalId: 'prof-teacher',
    professionalName: 'Emma Watson',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    domains: {
      communication: true,
      math: true,
      fineMotor: true,
      dressing: false,
      attention: true,
      clinicalNotes: false, // Classroom teacher sees simplified progress, not raw ABA notes
    },
    expiryDate: '2027-06-30',
    lastViewed: 'Today at 9:00 AM'
  },
  {
    id: 'grant-5',
    childId: 'child-lama',
    professionalId: 'prof-remedial',
    professionalName: 'James Chen',
    role: 'remedial',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    domains: {
      communication: true,
      math: true,
      fineMotor: false,
      dressing: false,
      attention: true,
      clinicalNotes: true,
    },
    expiryDate: '2027-09-01',
    lastViewed: '2 days ago'
  }
];

export const INITIAL_TARGETS: Target[] = [
  {
    id: 'target-lama-1',
    childId: 'child-lama',
    discipline: 'speech',
    name: 'Answering WH Questions (Where & What)',
    domain: 'Communication & Speech',
    origin: 'Comprehensive Pediatric Speech Evaluation (Aug 2026)',
    therapistName: 'Dr. Sarah Alharbi (Lead SLP)',
    baseline: 25,
    operationalDefinition: 'When shown an everyday scenario scene and asked "Where is [item]?" or "What is [person] doing?", Lama will answer with a target vocabulary word or 2-word phrase within 4 seconds without physical or model prompting.',
    materials: ['Everyday scenario flashcards (kitchen, park, classroom)', 'Visual choice board', 'Healthy snack rewards'],
    procedureSteps: [
      '1. Present visual scenario card in front of Lama.',
      '2. Deliver vocal discriminative stimulus: "Where is the apple?".',
      '3. Wait 4 seconds for processing.',
      '4. If no vocalization, deliver gesture prompt pointing to location.',
      '5. Immediate verbal praise and token.'
    ],
    masteryCriterion: '90% across 3 consecutive sessions',
    criterionThreshold: 90,
    currentPerformance: 85,
    status: 'teaching',
    suggestedAction: 'Fading verbal prompts to pure independent vocalizations',
    suggestedNextStep: 'Generalize to peer conversations in lunchroom',
    approvalStatus: 'approved',
    lastThreeSessions: [80, 85, 85],
    contributingSessions: [
      { id: 's-1', date: 'Oct 10, 2026', therapistName: 'Dr. Sarah Alharbi', scorePercent: 85, notes: 'Answered 5 of 6 WH questions accurately without verbal cue.', trialsRecorded: '10 trials (8 independent, 1 verbal, 1 model)', source: 'Clinic Session' },
      { id: 's-2', date: 'Oct 8, 2026', therapistName: 'Sarah Alharbi (Mother)', scorePercent: 80, notes: 'Practiced snack-time routine. Lama answered "Where apple" on first try!', trialsRecorded: '5 trials (4 independent, 1 prompt)', source: 'Home Practice' },
      { id: 's-3', date: 'Oct 6, 2026', therapistName: 'Dr. Sarah Alharbi', scorePercent: 80, notes: 'Targeted "Where" with classroom photo scenes.', trialsRecorded: '10 trials (8 independent, 2 verbal)', source: 'Clinic Session' }
    ]
  },
  {
    id: 'target-lama-2',
    childId: 'child-lama',
    discipline: 'ot',
    name: 'Fastening Vest Buttons & Tripod Grip',
    domain: 'Motor Skills & Daily Self-Care',
    origin: 'OT Fine Motor & Functional ADL Assessment (Sep 2026)',
    therapistName: 'Reem Al-Ahmad (OT Specialist)',
    baseline: 20,
    operationalDefinition: 'Lama will independently grasp, push, and pull 5 1-inch wooden buttons through elastic slots on a dressing vest, and maintain a functional tripod pencil grasp for 5 minutes.',
    materials: ['Adaptive button vest with 1-inch wooden buttons', 'Silicone molded pencil grip', 'Mirror'],
    procedureSteps: [
      '1. Stabilize vest hem with helper hand.',
      '2. Pinch button edge with dominant pincer grasp.',
      '3. Push button through slit until halfway visible.',
      '4. Switch hands to pull button completely through.'
    ],
    masteryCriterion: '85% independent steps across 3 sessions',
    criterionThreshold: 85,
    currentPerformance: 70,
    status: 'teaching',
    suggestedAction: 'Backward chaining on final button pull-through',
    suggestedNextStep: 'Transition to real school uniform cardigan buttons',
    approvalStatus: 'approved',
    lastThreeSessions: [60, 65, 70],
    contributingSessions: [
      { id: 's-4', date: 'Oct 8, 2026', therapistName: 'Reem Al-Ahmad', scorePercent: 70, notes: 'Buttoned 4 of 5 buttons with minimal guidance on step 3.', trialsRecorded: '5 button cycles (70% accuracy)', source: 'Clinic Session' },
      { id: 's-5', date: 'Oct 5, 2026', therapistName: 'Sarah Alharbi (Mother)', scorePercent: 65, notes: 'Dressing practice before school. Needed verbal prompt on button #3.', trialsRecorded: 'Morning dressing run', source: 'Home Practice' },
      { id: 's-6', date: 'Oct 3, 2026', therapistName: 'Reem Al-Ahmad', scorePercent: 60, notes: 'Introduced 1-inch buttons after hand warm-up therapy putty.', trialsRecorded: '5 button cycles', source: 'Clinic Session' }
    ]
  },
  {
    id: 'target-lama-3',
    childId: 'child-lama',
    discipline: 'behavior',
    name: 'Requesting Help During Frustration',
    domain: 'Functional Behavior & Communication',
    origin: 'Functional Behavior Assessment (FBA) by Dr. Tareq Hassan',
    therapistName: 'Dr. Tareq Hassan (BCBA)',
    baseline: 15,
    operationalDefinition: 'When experiencing a difficult task or delay in reinforcement, Lama will vocalize "Help please" or hand the help card within 3 seconds instead of crying or dropping to floor.',
    materials: ['Visual "Help" icon card', 'Challenging puzzle tasks', 'Differential reinforcement token board'],
    procedureSteps: [
      '1. Present a sealed container or high-difficulty puzzle.',
      '2. Observe latency to frustration cues.',
      '3. Immediate prompt before problem behavior occurs: model "Help please".',
      '4. Reinforce within 1 second of help request with adult assistance.'
    ],
    masteryCriterion: '90% across 3 consecutive sessions',
    criterionThreshold: 90,
    currentPerformance: 92,
    status: 'mastered',
    suggestedAction: 'Goal ready for supervisor mastery review & generalization',
    suggestedNextStep: 'Generalize to noisy cafeteria and playground transitions',
    approvalStatus: 'awaiting_approval',
    submittedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    lastThreeSessions: [90, 92, 92],
    contributingSessions: [
      { id: 's-7', date: 'Oct 12, 2026', therapistName: 'Dr. Tareq Hassan', scorePercent: 92, notes: 'Lama met mastery threshold! Latency dropped to 2.8s across 10 trials.', trialsRecorded: '10 trials (9 independent, 1 prompt)', source: 'Clinic Session' },
      { id: 's-8', date: 'Oct 9, 2026', therapistName: 'Ms. Layla Fahad', scorePercent: 92, notes: 'Used Help card spontaneously during difficult art scissors activity!', trialsRecorded: 'Classroom observation', source: 'Classroom Observation' },
      { id: 's-9', date: 'Oct 7, 2026', therapistName: 'Dr. Tareq Hassan', scorePercent: 90, notes: 'Zero vocal protest observed across 8 problem-solving trials.', trialsRecorded: '8 trials (7 independent, 1 verbal)', source: 'Clinic Session' }
    ]
  },
  {
    id: 'target-lama-4',
    childId: 'child-lama',
    discipline: 'remedial',
    name: 'Counting Objects 1-10 with Token Counters',
    domain: 'Functional Learning & Thinking',
    origin: 'Early Numeracy Screening & Classroom Plan',
    therapistName: 'Ms. Layla Fahad (Special Educator)',
    baseline: 30,
    operationalDefinition: 'Given an array of 1 to 10 manipulatives (counting bears/tokens), Lama will touch each item one-by-one with 1-to-1 correspondence and state the final cardinal number.',
    materials: ['Rainbow counting bears', '10-frame visual number mat', 'Number digit cards'],
    procedureSteps: [
      '1. Place 1-10 counting bears in front of student.',
      '2. Instruction: "Count the bears and tell me how many."',
      '3. Lama touches each bear in linear sequence from left to right.',
      '4. Reinforce cardinal answer.'
    ],
    masteryCriterion: '80% across 3 sessions',
    criterionThreshold: 80,
    currentPerformance: 65,
    status: 'teaching',
    suggestedAction: 'Use linear 10-frame track to prevent skipping items',
    suggestedNextStep: 'Match counted quantities to written numeral digits',
    approvalStatus: 'approved',
    lastThreeSessions: [55, 60, 65],
    contributingSessions: [
      { id: 's-10', date: 'Oct 11, 2026', therapistName: 'Ms. Layla Fahad', scorePercent: 65, notes: 'Accurate up to 6 items. Rushed through numbers 7 to 10.', trialsRecorded: '6 counting sets', source: 'Classroom Observation' },
      { id: 's-11', date: 'Oct 9, 2026', therapistName: 'Sarah Alharbi (Mother)', scorePercent: 60, notes: 'Counted apple slices at kitchen table with 10-frame paper.', trialsRecorded: 'Home dinner routine', source: 'Home Practice' },
      { id: 's-12', date: 'Oct 6, 2026', therapistName: 'Ms. Layla Fahad', scorePercent: 55, notes: 'Demonstrated good 1-to-1 touch up to 5 items.', trialsRecorded: '5 sets', source: 'Classroom Observation' }
    ]
  },
  {
    id: 'target-lama-5',
    childId: 'child-lama',
    discipline: 'teacher',
    name: 'Answering Peer Questions in Circle Time',
    domain: 'Social Connection & Play',
    origin: 'Inclusive Classroom Social Participation Goals',
    therapistName: 'Ms. Layla Fahad',
    baseline: 20,
    operationalDefinition: 'During morning circle or science time, Lama will answer peer greeting or question within 5 seconds using spoken words or visual communication card.',
    materials: ['Social circle question dice', 'Peer buddy pairing', 'Visual timer'],
    procedureSteps: [
      '1. Peer asks Lama structured question (e.g. "What is your favorite color?").',
      '2. Wait 5 seconds.',
      '3. Facilitate peer eye contact and verbal or card response.',
      '4. Shared high-five and group cheer!'
    ],
    masteryCriterion: '80% across 3 sessions',
    criterionThreshold: 80,
    currentPerformance: 80,
    status: 'mastered',
    suggestedAction: 'Target Mastered! Maintaining in natural group routines.',
    suggestedNextStep: 'Initiate greeting to unfamiliar peers in playground',
    approvalStatus: 'approved',
    lastThreeSessions: [75, 80, 80],
    contributingSessions: [
      { id: 's-13', date: 'Oct 13, 2026', therapistName: 'Ms. Layla Fahad', scorePercent: 80, notes: 'Spontaneously responded to classmate during science parts of a plant!', trialsRecorded: 'Circle time observation', source: 'Classroom Observation' },
      { id: 's-14', date: 'Oct 10, 2026', therapistName: 'Ms. Layla Fahad', scorePercent: 80, notes: 'Answered peer question about favorite animal with smile.', trialsRecorded: 'Morning circle', source: 'Classroom Observation' },
      { id: 's-15', date: 'Oct 7, 2026', therapistName: 'Ms. Layla Fahad', scorePercent: 75, notes: 'Peer buddy helped with visual gesture prompt.', trialsRecorded: 'Morning circle', source: 'Classroom Observation' }
    ]
  },
  {
    id: 'target-1',
    childId: 'child-2',
    discipline: 'speech',
    name: 'Answering WH Questions',
    domain: 'Communication & Receptive Language',
    operationalDefinition: 'Given a picture scene or short 2-sentence story and a "who", "what", or "where" question, Maya will respond with an accurate single word or phrase within 5 seconds without physical prompting.',
    materials: ['Everyday scenario flashcards (kitchen, playground, school)', 'Visual question prompt icon cards ("Who", "What", "Where")'],
    procedureSteps: [
      '1. Present visual scenario card in front of student.',
      '2. Deliver vocal discriminative stimulus (e.g. "Where is the dog sleeping?").',
      '3. Provide 4-second latency delay before stepping in.',
      '4. If no response, use verbal prompt ("Look at the bed... where is he?").',
      '5. Reinforce correct response immediately with social praise and token.'
    ],
    masteryCriterion: '90% across 3 consecutive sessions',
    criterionThreshold: 90,
    currentPerformance: 85,
    status: 'teaching',
    suggestedAction: 'Continue current target with verbal prompt fading',
    suggestedNextStep: 'Review related prerequisite skill (identifying locations in picture scenes)',
    approvalStatus: 'needs_review',
    reviewNote: 'Please add the baseline and a target date, then resubmit.',
    therapistName: 'Dr. Sarah Alharbi',
    lastThreeSessions: [80, 85, 85]
  },
  {
    id: 'target-2',
    childId: 'child-2',
    discipline: 'behavior',
    name: 'Identifying Common Objects (DTT)',
    domain: 'Receptive Identification',
    operationalDefinition: 'When presented with an array of 3 3D objects and instructed "Touch [object]", student will point to or touch the correct object within 3 seconds across 10 trials.',
    materials: ['Common object figurines (cup, spoon, shoe, ball, car)', 'Token board (5 tokens)', 'Preferred edibles/tangibles'],
    procedureSteps: [
      '1. Clear table and seat child facing instructor.',
      '2. Place 3 randomized items 6 inches apart.',
      '3. Deliver vocal instruction: "Touch the shoe".',
      '4. Least-to-most prompt hierarchy: Independent -> Gesture -> Model -> Physical.',
      '5. Record data on trial-by-trial grid.'
    ],
    masteryCriterion: '90% across 3 sessions',
    criterionThreshold: 90,
    currentPerformance: 88,
    status: 'teaching',
    suggestedAction: 'Continue current target; mastery near',
    suggestedNextStep: 'Prepare generalization probes across novel therapy rooms and home setting',
    approvalStatus: 'awaiting_approval',
    submittedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    baseline: 60,
    targetDate: new Date(Date.now() + 75 * 86400000).toISOString().slice(0, 10),
    promptLevel: 'Full physical → partial physical → gestural → independent',
    therapistName: 'Dr. Tareq Hassan',
    lastThreeSessions: [75, 85, 88]
  },
  {
    id: 'target-3',
    childId: 'child-3',
    discipline: 'ot',
    name: 'Buttoning a Shirt (Task Analysis)',
    domain: 'Independent Dressing & Fine Motor',
    operationalDefinition: 'Tariq will grasp, insert, and pull through 5 large buttons on a dressing vest independently from top to bottom.',
    materials: ['Therapy button vest with 1-inch wooden buttons', 'Mirror', 'Visual step schedule'],
    procedureSteps: [
      '1. Align bottom edge of vest.',
      '2. Pinch button with dominant pincer grasp.',
      '3. Push button halfway through slot.',
      '4. Transfer grasp with helper hand and pull through.'
    ],
    masteryCriterion: '85% independent steps across 3 sessions',
    criterionThreshold: 85,
    currentPerformance: 70,
    status: 'teaching',
    suggestedAction: 'Provide backward chaining on final 2 steps',
    suggestedNextStep: 'Introduce smaller 0.75-inch buttons once criterion is reached',
    approvalStatus: 'approved',
    lastThreeSessions: [60, 65, 70]
  },
  {
    id: 'target-4',
    childId: 'child-3',
    discipline: 'remedial',
    name: 'Words Correct Per Minute (WCPM Fluency)',
    domain: 'Reading & Functional Academics',
    operationalDefinition: 'Tariq will read aloud grade-appropriate 1st grade decodable text with at least 40 words correct per minute and fewer than 3 errors.',
    materials: ['Grade 1 Decodable Passages (Passage #14: The Red Hen)', 'Digital 60-second countdown stopwatch', 'Teacher scoring sheet'],
    procedureSteps: [
      '1. Provide student with printed passage.',
      '2. Say: "When I say start, begin reading out loud at the top. Do your best work."',
      '3. Start 60-second timer on first vocalization.',
      '4. Mark omissions and substitutions as errors; do not correct during the 1 minute.',
      '5. Calculate total words minus errors = WCPM.'
    ],
    masteryCriterion: '40 WCPM with 90% accuracy across 3 sessions',
    criterionThreshold: 40,
    currentPerformance: 34,
    status: 'teaching',
    suggestedAction: 'Implement repeated reading and pre-teaching of sight words',
    suggestedNextStep: 'Progress to 2-syllable compound words in decodables',
    approvalStatus: 'approved',
    lastThreeSessions: [28, 31, 34]
  }
];

export const INITIAL_AUDIT_LOG: AuditEvent[] = [
  {
    id: 'audit-1',
    timestamp: '2026-10-13 14:15:22',
    userId: 'user-behavior',
    userName: 'Dr. Maya Lin',
    role: 'behavior',
    action: 'RECORD_SESSION_DATA',
    resource: 'Lama Alharbi · Target: Identifying Objects (DTT)'
  },
  {
    id: 'audit-2',
    timestamp: '2026-10-13 11:32:05',
    userId: 'user-speech',
    userName: 'Elena Vance',
    role: 'speech',
    action: 'COMPLETE_SPEECH_TRIAL',
    resource: 'Lama Alharbi · Target: Answering WH questions (85% indep)'
  },
  {
    id: 'audit-3',
    timestamp: '2026-10-13 09:40:11',
    userId: 'user-parent',
    userName: 'Sarah Miller',
    role: 'parent',
    action: 'UPDATE_CONSENT_GRANT',
    resource: 'Permitted Emma Watson (Teacher) for Math & Communication'
  },
  {
    id: 'audit-4',
    timestamp: '2026-10-12 16:50:30',
    userId: 'user-supervisor',
    userName: 'Dr. Rebecca Hall',
    role: 'supervisor',
    action: 'APPROVE_TREATMENT_GOAL',
    resource: 'Approved Mastery Criteria for Buttoning a Shirt'
  },
  {
    id: 'audit-5',
    timestamp: '2026-10-12 10:12:44',
    userId: 'user-admin',
    userName: 'David Kim',
    role: 'admin',
    action: 'PDPL_COMPLIANCE_ACCESS_LOG',
    resource: 'Verified data encryption and consent ledger at rest'
  }
];

export const INITIAL_MESSAGES: MessageItem[] = [
  {
    id: 'msg-1',
    childId: 'child-lama',
    senderName: 'Sarah Miller',
    senderRole: 'parent',
    senderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    contentEn: 'Hi team! We tried the snack-time WH question game today. Lama answered "Where is the apple?" right away without needing a prompt!',
    contentAr: 'مرحباً بالفريق! جربنا لعبة أسئلة أين وماذا وقت الوجبة الخفيفة اليوم. أجاب ليو "أين التفاحة؟" فوراً دون الحاجة لمساعدة!',
    timestamp: 'Today at 3:12 PM',
    goalTag: 'Answering WH Questions',
    isParent: true,
  },
  {
    id: 'msg-2',
    childId: 'child-lama',
    senderName: 'Elena Vance, CCC-SLP',
    senderRole: 'speech',
    senderAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    contentEn: 'That is incredible news Sarah! That matches what we observed in our clinic session this morning (85% independent). We will keep fading the verbal cues.',
    contentAr: 'هذا خبر رائع يا سارة! هذا يتطابق تماماً مع ما لاحظناه في جلسة العيادة هذا الصباح (85٪ استقلالية). سنواصل تخفيف التلميحات اللفظية.',
    timestamp: 'Today at 3:25 PM',
    goalTag: 'Answering WH Questions',
    isParent: false,
  },
  {
    id: 'msg-3',
    childId: 'child-lama',
    senderName: 'Emma Watson',
    senderRole: 'teacher',
    senderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    contentEn: 'I also noticed Lama raised her hand during our science lesson about plants and answered where the roots grow. Great generalization!',
    contentAr: 'لاحظت أيضاً أن ليو رفع يده أثناء درس العلوم عن النباتات وأجاب عن مكان نمو الجذور. تعميم رائع للمهارة!',
    timestamp: 'Today at 4:02 PM',
    goalTag: 'Answering WH Questions',
    isParent: false,
  }
];

export const INITIAL_CONTACTS: ChatContact[] = [
  {
    id: 'contact-slp',
    name: 'Dr. Sarah Alharbi (Lead SLP)',
    roleTitle: 'Speech-Language Pathologist',
    avatarInitial: 'س',
    avatarBg: 'bg-[#EDE9FE] dark:bg-purple-950/60',
    avatarTextColor: 'text-[#7C3AED] dark:text-purple-300',
    online: true,
    timestamp: '10:50 AM',
    lastMessage: 'Wonderful! Remember to celebrate when she complete...',
    unreadCount: 0,
    category: 'therapists',
    messages: [
      {
        id: 'm1',
        childId: 'child-lama',
        senderName: 'Dr. Sarah Alharbi (Lead SLP)',
        senderRole: 'speech',
        senderAvatar: '',
        contentEn: 'Wonderful! Remember to celebrate when she completes the full phrase "I want apple please" without prompting.',
        contentAr: 'رائع جداً! تذكري أن تحتفلي فوراً عندما تكمل الجملة كاملة "أريد تفاحة من فضلك" بدون مساعدة.',
        timestamp: '10:50 AM',
        goalTag: 'Communication & Speech',
        isParent: false,
      },
      {
        id: 'm2',
        childId: 'child-lama',
        senderName: 'Sarah Alharbi',
        senderRole: 'parent',
        senderAvatar: '',
        contentEn: 'Thank you Dr. Sarah! She did it twice at breakfast today with a huge smile!',
        contentAr: 'شكراً د. سارة! فعلتها مرتين في وجبة الإفطار اليوم مع ابتسامة عريضة!',
        timestamp: '10:52 AM',
        goalTag: 'Communication & Speech',
        isParent: true,
      }
    ]
  },
  {
    id: 'contact-ot',
    name: 'Reem Al-Ahmad (OT Specialist)',
    roleTitle: 'Occupational Therapist',
    avatarInitial: 'ر',
    avatarBg: 'bg-[#D1FAE5] dark:bg-emerald-950/60',
    avatarTextColor: 'text-[#10B981] dark:text-emerald-300',
    online: true,
    timestamp: 'Yesterday',
    lastMessage: 'Please continue the sensory regulating deep-pre...',
    unreadCount: 2,
    category: 'therapists',
    messages: [
      {
        id: 'm3',
        childId: 'child-lama',
        senderName: 'Reem Al-Ahmad (OT Specialist)',
        senderRole: 'ot',
        senderAvatar: '',
        contentEn: 'Please continue the sensory regulating deep-pressure vest routine before handwriting tasks.',
        contentAr: 'يرجى الاستمرار في روتين سترة الضغط العميق المنظمة للحواس قبل مهام الكتابة اليدوية.',
        timestamp: 'Yesterday at 3:15 PM',
        goalTag: 'Motor Skills & Daily Self-Care',
        isParent: false,
      },
      {
        id: 'm4',
        childId: 'child-lama',
        senderName: 'Reem Al-Ahmad (OT Specialist)',
        senderRole: 'ot',
        senderAvatar: '',
        contentEn: 'We noticed a 40% reduction in finger fatigue with the silicone tripod pencil grip!',
        contentAr: 'لاحظنا انخفاضاً بنسبة 40٪ في إجهاد الأصابع مع قبضة القلم السيليكونية ثلاثية الأبعاد!',
        timestamp: 'Yesterday at 3:18 PM',
        goalTag: 'Motor Skills & Daily Self-Care',
        isParent: false,
      }
    ]
  },
  {
    id: 'contact-bcba',
    name: 'Dr. Tareq Hassan (BCBA)',
    roleTitle: 'Board Certified Behavior Analyst',
    avatarInitial: 'ط',
    avatarBg: 'bg-[#E0E7FF] dark:bg-indigo-950/60',
    avatarTextColor: 'text-[#4F46E5] dark:text-indigo-300',
    online: false,
    timestamp: 'Oct 12',
    lastMessage: '✓✓ Thank you Dr. Tareq. The 2-minute visual countdo...',
    unreadCount: 0,
    category: 'therapists',
    messages: [
      {
        id: 'm5',
        childId: 'child-lama',
        senderName: 'Dr. Tareq Hassan (BCBA)',
        senderRole: 'behavior',
        senderAvatar: '',
        contentEn: 'Lama met the mastery criterion for requesting help across 3 consecutive sessions! I have submitted the goal for supervisor review.',
        contentAr: 'حققت لمى معيار الإتقان لطلب المساعدة عبر 3 جلسات متتالية! لقد رفعت الهدف لمراجعة المشرف.',
        timestamp: 'Oct 12 at 4:30 PM',
        goalTag: 'Functional Learning & Thinking',
        isParent: false,
      },
      {
        id: 'm6',
        childId: 'child-lama',
        senderName: 'Sarah Alharbi',
        senderRole: 'parent',
        senderAvatar: '',
        contentEn: '✓✓ Thank you Dr. Tareq. The 2-minute visual countdown timer at home worked wonders during evening transitions.',
        contentAr: '✓✓ شكراً د. طارق. المؤقت البصري التنازلي لمدة دقيقتين في المنزل أحدث فرقاً رائعاً أثناء الانتقال المسائي.',
        timestamp: 'Oct 12 at 5:10 PM',
        goalTag: 'Functional Learning & Thinking',
        isParent: true,
      }
    ]
  },
  {
    id: 'contact-teacher',
    name: 'Ms. Layla Fahad (Special Educator)',
    roleTitle: 'Inclusive Classroom Teacher',
    avatarInitial: 'ل',
    avatarBg: 'bg-[#FEF3C7] dark:bg-amber-950/60',
    avatarTextColor: 'text-[#F59E0B] dark:text-amber-300',
    online: true,
    timestamp: 'Oct 11',
    lastMessage: 'Ahmed used his visual PECS card to request wat...',
    unreadCount: 1,
    category: 'school',
    messages: [
      {
        id: 'm7',
        childId: 'child-lama',
        senderName: 'Ms. Layla Fahad (Special Educator)',
        senderRole: 'teacher',
        senderAvatar: '',
        contentEn: 'Lama used her visual choice card to request water independently during science class today! Super proud of her.',
        contentAr: 'استخدمت لمى بطاقة الاختيار البصرية لطلب الماء باستقلالية أثناء حصة العلوم اليوم! فخورون جداً بها.',
        timestamp: 'Oct 11 at 1:20 PM',
        goalTag: 'Social Connection & Play',
        isParent: false,
      }
    ]
  },
  {
    id: 'contact-circle',
    name: 'Care Circle (Multidisciplinary Team)',
    roleTitle: 'SLP + OT + BCBA + Teacher + Parent',
    avatarInitial: '👥',
    avatarBg: 'bg-[#E0F2FE] dark:bg-sky-950/60',
    avatarTextColor: 'text-[#0EA5E9] dark:text-sky-300',
    online: true,
    timestamp: 'Oct 10',
    lastMessage: 'Interdisciplinary weekly goal review: Ahmed is advanc...',
    unreadCount: 0,
    category: 'circle',
    messages: [
      {
        id: 'm8',
        childId: 'child-lama',
        senderName: 'Dr. Sarah Alharbi (Lead SLP)',
        senderRole: 'speech',
        senderAvatar: '',
        contentEn: 'Interdisciplinary weekly goal review: Lama is advancing across communication and motor targets simultaneously. Synchronized strategy active.',
        contentAr: 'المراجعة الأسبوعية المشتركة للأهداف: تتقدم لمى في أهداف التواصل والمهارات الحركية معاً. الاستراتيجية الموحدة مفعلة.',
        timestamp: 'Oct 10 at 9:00 AM',
        goalTag: 'Interdisciplinary Review',
        isParent: false,
      }
    ]
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Goal ready for review',
    description: 'Lama Alharbi met the mastery criterion for requesting help across 3 sessions.',
    timestamp: '2h ago',
    type: 'goal',
    read: false,
    badge: 'Pending review'
  },
  {
    id: 'n2',
    title: 'New message from Reem Al-Ahmad (OT)',
    description: 'Please continue the sensory regulating deep-pressure vest routine.',
    timestamp: 'Yesterday',
    type: 'message',
    read: false
  },
  {
    id: 'n3',
    title: 'Weekly Progress Report Available',
    description: 'Dr. Sarah Alharbi compiled this week’s multidisciplinary progress summary.',
    timestamp: '2 days ago',
    type: 'session',
    read: true
  },
  {
    id: 'n4',
    title: 'Consent Access Verification',
    description: 'Ms. Layla Fahad accessed educational milestones under Saudi PDPL consent grant.',
    timestamp: '3 days ago',
    type: 'consent',
    read: true
  }
];

/** A child created by an administrator on the server: only the name is known until the team fills in the rest. */
export const blankChild = (id: string, name: string): Child => ({
  id,
  name,
  age: 0,
  avatar: '',
  diagnosis: '',
  caregivers: [],
  school: '',
  classroom: '',
  assignedTeam: [],
  todayProgress: [],
  thisWeek: {
    whatWeWorkedOn: '',
    whatChildIsDoingWell: '',
    whatNeedsMorePractice: '',
    howToPracticeAtHome: { title: '', description: '', materials: [], videoDuration: '', steps: [] },
  },
});

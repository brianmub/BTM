import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client directly
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials!');
    console.error('Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Seed script to populate the database with sample data for development/testing
 * 
 * Run this script with: tsx server/db/seed.ts
 */

async function seed() {
    console.log('🌱 Starting database seed...');

    try {
        // Create sample users
        console.log('Creating sample users...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .insert([
                {
                    full_name: 'John Participant',
                    phone: '+1234567890',
                    email: 'participant@example.com',
                    gender: 'male',
                    marital_status: 'married',
                    role: 'participant',
                    is_approved: true,
                },
                {
                    full_name: 'David Leader',
                    phone: '+1234567891',
                    email: 'leader@example.com',
                    gender: 'male',
                    marital_status: 'married',
                    role: 'leader',
                    leader_status: 'approved',
                    is_approved: true,
                },
                {
                    full_name: 'Sarah Facilitator',
                    phone: '+1234567892',
                    email: 'facilitator@example.com',
                    gender: 'female',
                    marital_status: 'married',
                    role: 'facilitator',
                    is_approved: true,
                },
                {
                    full_name: 'Michael Admin',
                    phone: '+1234567893',
                    email: 'admin@example.com',
                    gender: 'male',
                    marital_status: 'married',
                    role: 'admin',
                    is_approved: true,
                },
            ])
            .select();

        if (usersError) {
            console.error('Error creating users:', usersError);
            // If users already exist, fetch them
            const { data: existingUsers } = await supabase
                .from('users')
                .select('*')
                .in('email', [
                    'participant@example.com',
                    'leader@example.com',
                    'facilitator@example.com',
                    'admin@example.com',
                ]);

            if (existingUsers && existingUsers.length > 0) {
                console.log('✓ Using existing users');
            }
        } else {
            console.log(`✓ Created ${users?.length || 0} users`);
        }

        // Programs are already seeded via schema.sql
        console.log('✓ Programs already exist from schema');

        // Sessions are already seeded via schema.sql
        console.log('✓ Sessions already exist from schema');

        // Get the BeThatMan program ID
        const { data: programs } = await supabase
            .from('programs')
            .select('id, name')
            .eq('name', 'BeThatMan')
            .single();

        if (!programs) {
            console.error('BeThatMan program not found! Make sure to run schema.sql first.');
            return;
        }

        console.log(`✓ Found program: ${programs.name}`);

        // Get participant user
        const { data: participant } = await supabase
            .from('users')
            .select('id')
            .eq('email', 'participant@example.com')
            .single();

        // Get leader user
        const { data: leader } = await supabase
            .from('users')
            .select('id')
            .eq('email', 'leader@example.com')
            .single();

        if (participant && leader && programs) {
            // Create enrollment for participant
            console.log('Creating sample enrollment...');
            const { error: enrollmentError } = await supabase
                .from('enrollments')
                .insert({
                    user_id: participant.id,
                    program_id: programs.id,
                    status: 'enrolled',
                    sessions_attended: 0,
                    assignments_completed: 0,
                });

            if (enrollmentError && enrollmentError.code !== '23505') {
                // 23505 is unique violation
                console.error('Error creating enrollment:', enrollmentError);
            } else {
                console.log('✓ Created sample enrollment');
            }

            // Create a cell group
            console.log('Creating sample cell group...');
            const { data: cell, error: cellError } = await supabase
                .from('cell_groups')
                .insert({
                    program_id: programs.id,
                    name: 'Cell Group Alpha',
                    leader_id: leader.id,
                })
                .select()
                .single();

            if (cellError && cellError.code !== '23505') {
                console.error('Error creating cell group:', cellError);
            } else if (cell) {
                console.log('✓ Created cell group');

                // Add participant to cell
                const { error: memberError } = await supabase
                    .from('cell_members')
                    .insert({
                        cell_id: cell.id,
                        user_id: participant.id,
                    });

                if (memberError && memberError.code !== '23505') {
                    console.error('Error adding cell member:', memberError);
                } else {
                    console.log('✓ Added participant to cell group');
                }

                // Update enrollment with cell assignment
                await supabase
                    .from('enrollments')
                    .update({
                        status: 'assigned',
                        cell_id: cell.id
                    })
                    .eq('user_id', participant.id)
                    .eq('program_id', programs.id);
            }

            // Get first session
            const { data: sessions } = await supabase
                .from('sessions')
                .select('id')
                .eq('program_id', programs.id)
                .order('session_number')
                .limit(1);

            if (sessions && sessions.length > 0) {
                const sessionId = sessions[0].id;

                // Create attendance record
                console.log('Creating sample attendance...');
                const { error: attendanceError } = await supabase
                    .from('attendance_records')
                    .insert({
                        session_id: sessionId,
                        program_id: programs.id,
                        user_id: participant.id,
                        checked_in: true,
                        checked_in_at: new Date().toISOString(),
                        entry_time: new Date().toISOString(),
                        confirmed_by_leader: true,
                        confirmed_at: new Date().toISOString(),
                    });

                if (attendanceError && attendanceError.code !== '23505') {
                    console.error('Error creating attendance:', attendanceError);
                } else {
                    console.log('✓ Created sample attendance record');
                }

                // Create payment record
                console.log('Creating sample payment...');
                const { error: paymentError } = await supabase
                    .from('payment_records')
                    .insert({
                        session_id: sessionId,
                        program_id: programs.id,
                        user_id: participant.id,
                        amount: 10.00,
                        status: 'paid',
                        confirmed_by: leader.id,
                        confirmed_at: new Date().toISOString(),
                    });

                if (paymentError && paymentError.code !== '23505') {
                    console.error('Error creating payment:', paymentError);
                } else {
                    console.log('✓ Created sample payment record');
                }
            }
        }

        console.log('\n✅ Database seeding completed successfully!\n');
        console.log('Sample credentials:');
        console.log('  Participant: participant@example.com');
        console.log('  Leader: leader@example.com');
        console.log('  Facilitator: facilitator@example.com');
        console.log('  Admin: admin@example.com\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }

    process.exit(0);
}

seed();

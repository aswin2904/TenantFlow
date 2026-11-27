require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Organization = require('./models/Organization');
const Project = require('./models/Project');
const Task = require('./models/Task');
const AuditLog = require('./models/AuditLog');

const seedData = async () => {
  try {
    await connectDB();

    await Promise.all([
      User.deleteMany(),
      Organization.deleteMany(),
      Project.deleteMany(),
      Task.deleteMany(),
      AuditLog.deleteMany(),
    ]);

    const adminUser = await User.create({
      name: 'Aswin R (Admin)',
      email: 'admin@tenantflow.com',
      password: 'password123',
    });

    const devUser = await User.create({
      name: 'Karthik (Developer)',
      email: 'dev@tenantflow.com',
      password: 'password123',
    });

    const viewerUser = await User.create({
      name: 'Priya (Viewer)',
      email: 'viewer@tenantflow.com',
      password: 'password123',
    });

    const org1 = await Organization.create({
      name: 'Acme Cloud Solutions',
      slug: 'acme-cloud-1001',
      owner: adminUser._id,
      plan: 'PRO',
      members: [
        { user: adminUser._id, role: 'ADMIN' },
        { user: devUser._id, role: 'DEVELOPER' },
        { user: viewerUser._id, role: 'VIEWER' },
      ],
    });

    const org2 = await Organization.create({
      name: 'Beta FinTech Labs',
      slug: 'beta-fintech-2002',
      owner: adminUser._id,
      plan: 'ENTERPRISE',
      members: [{ user: adminUser._id, role: 'ADMIN' }],
    });

    adminUser.activeOrganization = org1._id;
    devUser.activeOrganization = org1._id;
    viewerUser.activeOrganization = org1._id;
    await Promise.all([adminUser.save(), devUser.save(), viewerUser.save()]);

    const proj1 = await Project.create({
      organizationId: org1._id,
      name: 'Core Platform v2.0',
      key: 'CORE',
      description: 'Multi-tenant authentication and real-time Kanban board rollout',
      lead: adminUser._id,
    });

    await Project.create({
      organizationId: org2._id,
      name: 'Payment Gateway Engine',
      key: 'PAY',
      description: 'Confidential Beta FinTech project (Invisible to Acme members)',
      lead: adminUser._id,
    });

    await Task.insertMany([
      {
        organizationId: org1._id,
        projectId: proj1._id,
        title: 'Implement JWT HttpOnly Cookie Auth',
        description: 'Secure login & registration endpoints with bcrypt hashing',
        status: 'DONE',
        priority: 'HIGH',
        order: 0,
        assignee: adminUser._id,
        reporter: adminUser._id,
      },
      {
        organizationId: org1._id,
        projectId: proj1._id,
        title: 'Build Socket.io Real-Time Kanban Sync',
        description: 'Broadcast card drag-and-drop updates to active project rooms',
        status: 'IN_PROGRESS',
        priority: 'CRITICAL',
        order: 0,
        assignee: devUser._id,
        reporter: adminUser._id,
      },
      {
        organizationId: org1._id,
        projectId: proj1._id,
        title: 'Add MongoDB Aggregation Analytics Chart',
        description: 'Group tasks by status and priority per organization',
        status: 'TODO',
        priority: 'MEDIUM',
        order: 0,
        assignee: devUser._id,
        reporter: adminUser._id,
      },
    ]);

    console.log('Demo Multi-Tenant Data Seeded Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
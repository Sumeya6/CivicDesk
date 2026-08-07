require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaPg } = require("@prisma/adapter-pg");
const {
  PrismaClient,
  Role,
  Language,
  CategoryType,
  Priority,
  TicketStatus,
} = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run the Prisma seed script.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.maintenanceNote.deleteMany(),
    prisma.technicianOffice.deleteMany(),
    prisma.ticket.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.user.deleteMany(),
    prisma.category.deleteMany(),
    prisma.office.deleteMany(),
  ]);

  const officesData = [
    {
      code: "LAND_MGMT",
      nameAm: "የመሬት ልማትና ማኔጅመንት ጽሕፈት ቤት",
      nameEn: "Land Development Management Office",
    },
    {
      code: "PEACE_SEC",
      nameAm: "የሰላምና ጸጥታ ጽሕፈት ቤት",
      nameEn: "Peace and Security Office",
    },
    {
      code: "REG_ENFORCE",
      nameAm: "የደንብ ማስከበር ጽሕፈት ቤት",
      nameEn: "Office of Regulation Enforcement",
    },
    {
      code: "LAND_DEV",
      nameAm: "የመሬት ልማት ጽሕፈት ቤት",
      nameEn: "Land Development Office",
    },
    {
      code: "TRADE",
      nameAm: "የንግድ ጽሕፈት ቤት",
      nameEn: "Trade Office",
    },
    {
      code: "IT",
      nameAm: "የኢንፎርሜሽን ቴክኖሎጂ ጽሕፈት ቤት",
      nameEn: "Information Technology Office",
    },
    {
      code: "DESIGN_CONST",
      nameAm: "የዲዛይንና ግንባታ ጽሕፈት ቤት",
      nameEn: "Design and Construction Office",
    },
    {
      code: "GOVT_PROP",
      nameAm: "የመንግስት ንብረት አስተዳደር ጽሕፈት ቤት",
      nameEn: "Government Property Management Office",
    },
    {
      code: "GOOD_GOV",
      nameAm: "የመልካም አስተዳደር ቅሬታና አቤቱታ ጽሕፈት ቤት",
      nameEn: "Good Governance Complaints and Appeals Office",
    },
    {
      code: "COUNCIL",
      nameAm: "የምክር ቤት ጽሕፈት ቤት",
      nameEn: "Council Office",
    },
    {
      code: "PUBLIC_SERVICE",
      nameAm: "የሕዝብ አገልግሎትና የሰው ሀብት ልማት ጽሕፈት ቤት",
      nameEn: "Public Service and Human Resource Development Office",
    },
    {
      code: "CIVIL_REG",
      nameAm: "የወታደራዊና የነዋሪነት አገልግሎት ኤጀንሲ",
      nameEn: "Civil Registration and Residence Service Agency",
    },
    {
      code: "EDUCATION",
      nameAm: "የትምህርት ጽሕፈት ቤት",
      nameEn: "Education Office",
    },
    {
      code: "ETHICS",
      nameAm: "የሥነ-ምግባርና ፀረ-ሙስና ጽሕፈት ቤት",
      nameEn: "Ethics and Anti-Corruption Office",
    },
    {
      code: "TVET",
      nameAm: "የሙያና ቴክኒክ ስልጠና ጽሕፈት ቤት",
      nameEn: "Vocational Training Office",
    },
    {
      code: "FINANCE",
      nameAm: "የፋይናንስ ጽሕፈት ቤት",
      nameEn: "Finance Office",
    },
    {
      code: "CEO_OFFICE",
      nameAm: "የዋና ሥራ አስፈፃሚ ጽሕፈት ቤት",
      nameEn: "Chief Executive Officer Office",
    },
    {
      code: "CEO_TEAM",
      nameAm: "የዋና ሥራ አስፈፃሚ ቡድን",
      nameEn: "Chief Executive Officer Executive Team",
    },
  ];

  const officeRecords = {};
  for (const office of officesData) {
    officeRecords[office.code] = await prisma.office.create({
      data: office,
    });
  }

  const categoriesData = [
    {
      nameAm: "የፕሪንተር / የስካነር ችግር (Printer / Scanner Failure)",
      nameEn: "Printer / Scanner Failure",
      type: CategoryType.HARDWARE,
      expectedResolutionHours: 24,
    },
    {
      nameAm: "የኮምፒውተር ሃርድዌር ብልሽት (Desktop / Laptop Hardware Damage)",
      nameEn: "Desktop / Laptop Hardware Damage",
      type: CategoryType.HARDWARE,
      expectedResolutionHours: 12,
    },
    {
      nameAm: "የሞኒተር / ዲሲፕሌይ ችግር (Monitor / Display Issue)",
      nameEn: "Monitor / Display Issue",
      type: CategoryType.HARDWARE,
      expectedResolutionHours: 8,
    },
    {
      nameAm: "የኦፕሬቲንግ ሲስተም ብልሽት (OS Failure / Blue Screen)",
      nameEn: "OS Failure / Blue Screen",
      type: CategoryType.SOFTWARE,
      expectedResolutionHours: 8,
    },
    {
      nameAm: "የኢሜይል / የአካውንት መግቢያ ችግር (Email / Account Access Issue)",
      nameEn: "Email / Account Access Issue",
      type: CategoryType.SOFTWARE,
      expectedResolutionHours: 4,
    },
    {
      nameAm: "የአንቲቫይረስ / የደህንነት ማስጠንቀቂያ (Antivirus / Security Alert)",
      nameEn: "Antivirus / Security Alert",
      type: CategoryType.SOFTWARE,
      expectedResolutionHours: 6,
    },
    {
      nameAm: "የዋይፋይ / የኢንተርኔት መቋረጥ (Wi-Fi / Internet Disconnection)",
      nameEn: "Wi-Fi / Internet Disconnection",
      type: CategoryType.NETWORKING,
      expectedResolutionHours: 6,
    },
    {
      nameAm: "የኔትወርክ ኬብል / ፖርት ብልሽት (LAN Cable / Ethernet Port Damage)",
      nameEn: "LAN Cable / Ethernet Port Damage",
      type: CategoryType.NETWORKING,
      expectedResolutionHours: 12,
    },
    {
      nameAm: "አጠቃላይ የአይቲ ድጋፍ (General IT Assistance)",
      nameEn: "General IT Assistance",
      type: CategoryType.OTHER,
      expectedResolutionHours: 24,
    },
  ];

  const categoryRecords = {};
  for (const category of categoriesData) {
    categoryRecords[category.nameEn] = await prisma.category.create({
      data: category,
    });
  }

  const users = {
    admin: await prisma.user.create({
      data: {
        fullName: "አበበ ከበደ (Abebe Kebede)",
        phoneNumber: "+251911000001",
        password: passwordHash,
        role: Role.ADMIN,
        officeId: officeRecords.CEO_OFFICE.id,
        preferredLanguage: Language.AM,
      },
    }),
    techOne: await prisma.user.create({
      data: {
        fullName: "ሰለሞን ተክሌ (Solomon Tekle)",
        phoneNumber: "+251911000002",
        password: passwordHash,
        role: Role.TECHNICIAN,
        officeId: officeRecords.IT.id,
        preferredLanguage: Language.AM,
      },
    }),
    techTwo: await prisma.user.create({
      data: {
        fullName: "ሀና አለሙ (Hana Alemu)",
        phoneNumber: "+251911000003",
        password: passwordHash,
        role: Role.TECHNICIAN,
        officeId: officeRecords.PUBLIC_SERVICE.id,
        preferredLanguage: Language.AM,
      },
    }),
    employeeOne: await prisma.user.create({
      data: {
        fullName: "ትግስት አሰፋ (Tigist Assefa)",
        phoneNumber: "+251911000004",
        password: passwordHash,
        role: Role.EMPLOYEE,
        officeId: officeRecords.EDUCATION.id,
        preferredLanguage: Language.AM,
      },
    }),
    employeeTwo: await prisma.user.create({
      data: {
        fullName: "ዳዊት ጊርማ (Dawit Girma)",
        phoneNumber: "+251911000005",
        password: passwordHash,
        role: Role.EMPLOYEE,
        officeId: officeRecords.FINANCE.id,
        preferredLanguage: Language.AM,
      },
    }),
  };

  await prisma.technicianOffice.createMany({
    data: [
      { technicianId: users.techOne.id, officeId: officeRecords.IT.id },
      {
        technicianId: users.techOne.id,
        officeId: officeRecords.DESIGN_CONST.id,
      },
      { technicianId: users.techOne.id, officeId: officeRecords.CEO_TEAM.id },
      {
        technicianId: users.techTwo.id,
        officeId: officeRecords.PUBLIC_SERVICE.id,
      },
      { technicianId: users.techTwo.id, officeId: officeRecords.EDUCATION.id },
      { technicianId: users.techTwo.id, officeId: officeRecords.FINANCE.id },
    ],
  });

  const pendingTicket = await prisma.ticket.create({
    data: {
      title: "የኢንተርኔት መቋረጥ ችግር",
      description: "በቢሮው ውስጥ የኢንተርኔት ግንኙነት በድንገት ተቋርጧል።",
      categoryId: categoryRecords["Wi-Fi / Internet Disconnection"].id,
      employeeId: users.employeeOne.id,
      officeId: officeRecords.EDUCATION.id,
      deviceOrSystem: "ቢሮ አውታረ መረብ (Office Network)",
      createdAt: hoursAgo(18),
    },
  });

  const inProgressTicket = await prisma.ticket.create({
    data: {
      title: "የፕሪንተር ማተም አለመቻል",
      description: "የአታሚው ቶነር መጠን ከፍተኛ ምልክት እየታየ ነው እና ሰነድ አያተምም።",
      categoryId: categoryRecords["Printer / Scanner Failure"].id,
      employeeId: users.employeeTwo.id,
      technicianId: users.techOne.id,
      officeId: officeRecords.FINANCE.id,
      deviceOrSystem: "አታሚ (Printer)",
      priority: Priority.HIGH,
      status: TicketStatus.IN_PROGRESS,
      createdAt: hoursAgo(12),
    },
  });

  const awaitingPurchaseTicket = await prisma.ticket.create({
    data: {
      title: "የአታሚ ቶነር መቀየር አስፈላጊ ሆኗል",
      description: "የፕሪንተሩ ቶነር አልቋል፣ በመታተም ላይ ትኩረት የሚያስፈልግ የንጥረ ነገር ግዢ ይፈልጋል።",
      categoryId: categoryRecords["Printer / Scanner Failure"].id,
      employeeId: users.employeeOne.id,
      technicianId: users.techOne.id,
      officeId: officeRecords.PUBLIC_SERVICE.id,
      deviceOrSystem: "HP LaserJet Printer",
      priority: Priority.MEDIUM,
      status: TicketStatus.AWAITING_PURCHASE,
      requiresPurchase: true,
      purchaseDetails: "የአታሚ ካርትሪጅ (HP LaserJet Toner 85A) መገዛት አለበት",
      createdAt: hoursAgo(10),
    },
  });

  const resolvedTicket = await prisma.ticket.create({
    data: {
      title: "የኢሜይል መግቢያ ችግር",
      description: "ተጠቃሚው ወደ የሥራ ኢሜይሉ መግባት አልቻለም እና የይለፍ ቃሉ መቀየር ያስፈለገ።",
      categoryId: categoryRecords["Email / Account Access Issue"].id,
      employeeId: users.employeeOne.id,
      technicianId: users.techTwo.id,
      officeId: officeRecords.IT.id,
      deviceOrSystem: "የሥራ ኢሜይል (Work Email)",
      priority: Priority.MEDIUM,
      status: TicketStatus.RESOLVED,
      resolvedAt: hoursAgo(4),
      createdAt: hoursAgo(20),
    },
  });

  await prisma.maintenanceNote.create({
    data: {
      ticketId: resolvedTicket.id,
      diagnosis: "የመግቢያ መብቱ በኢሜይል ስርዓት ላይ ተቆልፎ ነበር።",
      workPerformed: "መለያው ተፈትቶ አዲስ የይለፍ ቃል ተዘጋጀ፣ የመግቢያ ፈተናም ተሳካ።",
      partsReplaced: null,
      recommendations: "የይለፍ ቃል መቀየር የሚያስታውስ መመሪያ እንዲቀመጥ ተመከረ።",
      purchasedByOffice: false,
    },
  });

  const closedTicket = await prisma.ticket.create({
    data: {
      title: "የላፕቶፕ የሲስተም መልሶ መጫን ስራ",
      description: "የተጠቃሚው ላፕቶፕ ሲስተም ይዘት ተበላሽቶ ነበር እና ከጥገና በኋላ ተዘግቷል።",
      categoryId: categoryRecords["OS Failure / Blue Screen"].id,
      employeeId: users.employeeTwo.id,
      technicianId: users.techTwo.id,
      officeId: officeRecords.FINANCE.id,
      deviceOrSystem: "Dell Latitude Laptop",
      priority: Priority.HIGH,
      status: TicketStatus.CLOSED,
      isApproved: true,
      rating: 5,
      feedback: "ሥራው በጥራት ተጠናቋል",
      resolvedAt: hoursAgo(6),
      closedAt: hoursAgo(2),
      createdAt: hoursAgo(30),
    },
  });

  await prisma.maintenanceNote.create({
    data: {
      ticketId: closedTicket.id,
      diagnosis: "የሲስተሙ ፋይሎች ተበላሽተው የመነሻ ሂደት ተቋርጧል።",
      workPerformed: "ሲስተሙ እንደገና ተጫነ፣ የድራይቨሮች ጭነት ተጠናቀቀ እና መሣሪያው ተፈትኖ ተረጋገጠ።",
      partsReplaced: "ምንም አካላዊ ክፍል አልተቀየረም።",
      recommendations: "ሙሉ የሲስተም ምትክ ቅጂ በየሳምንቱ እንዲቀመጥ ተመከረ።",
      purchasedByOffice: false,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        ticketId: pendingTicket.id,
        actorId: users.employeeOne.id,
        action: "TICKET_CREATED",
        previousValue: null,
        newValue: pendingTicket.title,
      },
      {
        ticketId: inProgressTicket.id,
        actorId: users.employeeTwo.id,
        action: "TICKET_CREATED",
        previousValue: null,
        newValue: inProgressTicket.title,
      },
      {
        ticketId: inProgressTicket.id,
        actorId: users.admin.id,
        action: "PRIORITY_SET",
        previousValue: null,
        newValue: Priority.HIGH,
      },
      {
        ticketId: inProgressTicket.id,
        actorId: users.admin.id,
        action: "ASSIGNED",
        previousValue: null,
        newValue: users.techOne.id,
      },
      {
        ticketId: inProgressTicket.id,
        actorId: users.techOne.id,
        action: "STATUS_CHANGE",
        previousValue: TicketStatus.ASSIGNED,
        newValue: TicketStatus.IN_PROGRESS,
      },
      {
        ticketId: awaitingPurchaseTicket.id,
        actorId: users.employeeOne.id,
        action: "TICKET_CREATED",
        previousValue: null,
        newValue: awaitingPurchaseTicket.title,
      },
      {
        ticketId: awaitingPurchaseTicket.id,
        actorId: users.admin.id,
        action: "PRIORITY_SET",
        previousValue: null,
        newValue: Priority.MEDIUM,
      },
      {
        ticketId: awaitingPurchaseTicket.id,
        actorId: users.admin.id,
        action: "ASSIGNED",
        previousValue: null,
        newValue: users.techOne.id,
      },
      {
        ticketId: awaitingPurchaseTicket.id,
        actorId: users.techOne.id,
        action: "PURCHASE_REQUIRED",
        previousValue: "false",
        newValue: awaitingPurchaseTicket.purchaseDetails,
      },
      {
        ticketId: awaitingPurchaseTicket.id,
        actorId: users.techOne.id,
        action: "STATUS_CHANGE",
        previousValue: TicketStatus.IN_PROGRESS,
        newValue: TicketStatus.AWAITING_PURCHASE,
      },
      {
        ticketId: resolvedTicket.id,
        actorId: users.employeeOne.id,
        action: "TICKET_CREATED",
        previousValue: null,
        newValue: resolvedTicket.title,
      },
      {
        ticketId: resolvedTicket.id,
        actorId: users.admin.id,
        action: "ASSIGNED",
        previousValue: null,
        newValue: users.techTwo.id,
      },
      {
        ticketId: resolvedTicket.id,
        actorId: users.admin.id,
        action: "PURCHASE_APPROVED",
        previousValue: "false",
        newValue: "true",
      },
      {
        ticketId: resolvedTicket.id,
        actorId: users.techTwo.id,
        action: "STATUS_CHANGE",
        previousValue: TicketStatus.AWAITING_PURCHASE,
        newValue: TicketStatus.RESOLVED,
      },
      {
        ticketId: resolvedTicket.id,
        actorId: users.techTwo.id,
        action: "RESOLUTION",
        previousValue: "የኢሜይል መግቢያ ችግር",
        newValue: "መለያው ተከፍቶ የአዲስ መግቢያ ማረጋገጫ ተጠናቀቀ።",
      },
      {
        ticketId: closedTicket.id,
        actorId: users.employeeTwo.id,
        action: "TICKET_CREATED",
        previousValue: null,
        newValue: closedTicket.title,
      },
      {
        ticketId: closedTicket.id,
        actorId: users.admin.id,
        action: "PRIORITY_SET",
        previousValue: null,
        newValue: Priority.HIGH,
      },
      {
        ticketId: closedTicket.id,
        actorId: users.admin.id,
        action: "ASSIGNED",
        previousValue: null,
        newValue: users.techTwo.id,
      },
      {
        ticketId: closedTicket.id,
        actorId: users.techTwo.id,
        action: "STATUS_CHANGE",
        previousValue: TicketStatus.RESOLVED,
        newValue: TicketStatus.CLOSED,
      },
      {
        ticketId: closedTicket.id,
        actorId: users.employeeTwo.id,
        action: "APPROVAL",
        previousValue: "false",
        newValue: "true",
      },
      {
        ticketId: closedTicket.id,
        actorId: users.employeeTwo.id,
        action: "RATING",
        previousValue: null,
        newValue: "5",
      },
      {
        ticketId: closedTicket.id,
        actorId: users.employeeTwo.id,
        action: "FEEDBACK",
        previousValue: null,
        newValue: "ሥራው በጥራት ተጠናቋል",
      },
    ],
  });

  await prisma.announcement.create({
    data: {
      title: "የእሁድ ቀን የሲስተም ጥገና ማስታወቂያ",
      content:
        "በፊታችን እሁድ ከጠዋቱ 2:00 እስከ 6:00 የኔትወርክ ማሻሻያ ስራ ስለሚሰራ አገልግሎት ሊቋረጥ ይችላል።",
      authorId: users.admin.id,
    },
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

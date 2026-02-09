import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Pagination params (Author: Sanket)
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    // Filter params (Author: Sanket)
    const subject = searchParams.get('subject');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const teacherId = searchParams.get('teacherId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const timeOfDay = searchParams.get('timeOfDay'); // morning, afternoon, evening
    const isFree = searchParams.get('isFree'); // true/false
    const sort = searchParams.get('sort') || 'date'; // date, price, popularity
    
    // Build where clause (Author: Sanket)
    const where: any = {
      status: 'Scheduled',
      scheduledAt: {
        gte: new Date() // Only future sessions
      }
    };
    
    // Subject filter
    if (subject) {
      where.subject = subject;
    }
    
    // Price filters
    if (isFree === 'true') {
      where.price = 0;
    } else if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseInt(minPrice) * 100; // Convert to cents
      if (maxPrice) where.price.lte = parseInt(maxPrice) * 100;
    }
    
    // Teacher filter
    if (teacherId) {
      where.teacherId = teacherId;
    }
    
    // Date range filter
    if (startDate && endDate) {
      where.scheduledAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else if (startDate) {
      where.scheduledAt = {
        gte: new Date(startDate)
      };
    } else if (endDate) {
      where.scheduledAt = {
        ...where.scheduledAt,
        lte: new Date(endDate)
      };
    }
    
    // Time of day filter (Author: Sanket)
    if (timeOfDay) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (timeOfDay === 'morning') {
        // 6 AM - 12 PM
        where.scheduledAt = {
          ...where.scheduledAt,
          gte: where.scheduledAt?.gte || today
        };
        // Add hour filter in application layer
      } else if (timeOfDay === 'afternoon') {
        // 12 PM - 6 PM
        where.scheduledAt = {
          ...where.scheduledAt,
          gte: where.scheduledAt?.gte || today
        };
      } else if (timeOfDay === 'evening') {
        // 6 PM - 12 AM
        where.scheduledAt = {
          ...where.scheduledAt,
          gte: where.scheduledAt?.gte || today
        };
      }
    }
    
    // Search filter (Author: Sanket)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { teacher: { user: { name: { contains: search, mode: 'insensitive' } } } }
      ];
    }
    
    // Get total count for pagination (Author: Sanket)
    const total = await prisma.groupClass.count({ where });
    
    // Build orderBy clause (Author: Sanket)
    let orderBy: any = { scheduledAt: 'asc' };
    if (sort === 'price') {
      orderBy = { price: 'asc' };
    } else if (sort === 'popularity') {
      orderBy = { enrollments: { _count: 'desc' } };
    }
    
    // Get paginated sessions (Author: Sanket)
    const groupClasses = await prisma.groupClass.findMany({
      where,
      skip,
      take: limit,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        enrollments: {
          where: {
            status: 'Active'
          },
          select: {
            id: true
          }
        },
        _count: {
          select: {
            enrollments: {
              where: {
                status: 'Active'
              }
            }
          }
        }
      },
      orderBy,
    });
    
    // Filter by time of day in application layer (Author: Sanket)
    let filteredSessions = groupClasses;
    if (timeOfDay) {
      filteredSessions = groupClasses.filter(session => {
        const hour = new Date(session.scheduledAt).getHours();
        if (timeOfDay === 'morning') return hour >= 6 && hour < 12;
        if (timeOfDay === 'afternoon') return hour >= 12 && hour < 18;
        if (timeOfDay === 'evening') return hour >= 18 && hour < 24;
        return true;
      });
    }
    
    // Transform the data (Author: Sanket)
    const transformedSessions = filteredSessions.map(session => {
      const confirmedBookings = session._count.enrollments;
      const maxParticipants = session.maxStudents || 12;
      const availableSlots = Math.max(0, maxParticipants - confirmedBookings);
      
      return {
        id: session.id,
        title: session.title,
        description: session.description,
        teacher: {
          id: session.teacher.user.id,
          name: session.teacher.user.name || "Anonymous Teacher",
          avatar: session.teacher.user.image || "/placeholder-avatar.svg",
          rating: session.teacher.rating || 0,
          totalReviews: session.teacher.totalReviews || 0,
          isVerified: session.teacher.isVerified,
        },
        scheduledAt: session.scheduledAt,
        duration: session.duration,
        price: session.price,
        subject: session.subject,
        type: "group",
        availableSlots,
        maxParticipants,
        confirmedBookings,
        bookedByCurrentUser: false, // Will be updated based on authentication
      };
    });
    
    // Return with pagination metadata (Author: Sanket)
    return NextResponse.json({
      sessions: transformedSessions,
      pagination: {
        page,
        limit,
        total: timeOfDay ? filteredSessions.length : total,
        totalPages: Math.ceil((timeOfDay ? filteredSessions.length : total) / limit),
        hasMore: skip + limit < (timeOfDay ? filteredSessions.length : total)
      }
    });
  } catch (error) {
    console.error("Error fetching live sessions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
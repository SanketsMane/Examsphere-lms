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
      status: 'scheduled', // Lowercase 'scheduled' for LiveSession
      scheduledAt: {
        gte: new Date() // Only future sessions
      }
    };
    
    // Subject filter
    if (subject) {
      where.subject = { contains: subject, mode: 'insensitive' };
    }
    
    // Price filters
    if (isFree === 'true') {
      where.price = 0;
    } else if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Math.round(Number(minPrice) * 100);
      if (maxPrice) where.price.lte = Math.round(Number(maxPrice) * 100);
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
    
    // Time of day filter (matches existing logic)
    if (timeOfDay) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      where.scheduledAt = {
         ...where.scheduledAt,
         gte: where.scheduledAt?.gte || today
      };
    }

    // Search filter (Author: Sanket)
    if (search) {
      if (!where.AND) where.AND = [];
      where.AND.push({
        OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { subject: { contains: search, mode: 'insensitive' } },
            { teacher: { user: { name: { contains: search, mode: 'insensitive' } } } }
        ]
      });
    }
    
    // Get total count for pagination (Author: Sanket)
    const total = await prisma.liveSession.count({ where });
    
    // Build orderBy clause (Author: Sanket)
    let orderBy: any = { scheduledAt: 'asc' };
    if (sort === 'price') {
      orderBy = { price: 'asc' };
    } else if (sort === 'popularity') {
    //   orderBy = { bookings: { _count: 'desc' } }; // Use bookings count for LiveSession
      orderBy = { updatedAt: 'desc' }; // Fallback if bookings relation count complexity
    }
    
    // Get paginated sessions (Author: Sanket)
    const liveSessions = await prisma.liveSession.findMany({
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
        // LiveSession usually stores subject as string, but if specific relation exists, include checks needed.
        // Based on schema, subject is String?.
        bookings: {
             select: { id: true }
        },
        _count: {
            select: { bookings: true }
        }
      },
      orderBy,
    });
    
    // Filter by time of day in application layer (Author: Sanket)
    let filteredSessions = liveSessions;
    if (timeOfDay) {
      filteredSessions = liveSessions.filter(session => {
        const hour = new Date(session.scheduledAt).getHours();
        if (timeOfDay === 'morning') return hour >= 6 && hour < 12;
        if (timeOfDay === 'afternoon') return hour >= 12 && hour < 18;
        if (timeOfDay === 'evening') return hour >= 18 && hour < 24;
        return true;
      });
    }
    
    // Transform the data (Author: Sanket)
    const transformedSessions = filteredSessions.map(session => {
      const confirmedBookings = (session as any)._count?.bookings || 0;
      const maxParticipants = session.maxParticipants || 1; // Default to 1 if not set
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
        subject: session.subject || "General", 
        subjectId: session.subject, // LiveSession uses string for subject, mapping loosely
        type: maxParticipants > 1 ? "group" : "one-on-one",
        availableSlots,
        maxParticipants,
        confirmedBookings,
        bookedByCurrentUser: false, 
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
      },
      // Added filter options - Author: Sanket
      options: {
        subjects: [], // Can implement aggregation if needed: await prisma.liveSession.groupBy({ by: ['subject'] })
        teachers: Array.from(
          new Map(
            liveSessions.map(s => [s.teacher.user.id, { id: s.teacher.user.id, name: s.teacher.user.name }])
          ).values()
        )
      }
    });
  } catch (error) {
    console.error("Error fetching live sessions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
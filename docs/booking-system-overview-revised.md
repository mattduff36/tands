flowchart TD
  %% Customer Booking Flow
  subgraph Customer
    direction TB
    C1[Visit website & fill booking form] --> C2[Submit form]
  end

  subgraph System
    direction TB
    C2 --> S1[Create 'pending' booking in DB]
  end

  %% Admin Review
  subgraph Admin
    direction TB
    S1 --> A1[Admin reviews bookings]
    A1 -->|Approve/Edit & Save| A2[Send agreement email to customer]
    A1 -->|Delete| A3[Set booking status to 'expired']
    A1 -->|Add manual booking| A4[Send agreement or Save as confirmed]
    A4 -->|Send agreement| A2
    A4 -->|Save as confirmed| S2[Set booking 'confirmed' & create calendar event]
  end

  %% Agreement Signing
  subgraph Customer
    direction TB
    A2 --> C3[Customer signs agreement]
  end

  subgraph System
    direction TB
    C3 --> S2[Set booking 'confirmed' & create calendar event]
  end

  %% Calendar Sync
  subgraph Calendar
    direction TB
    S2 --> Cal1[Calendar event created]
    Cal1 --> Cal2[Event runs to completion]
    Cal2 --> S3[Booking status set to 'completed']
  end

  %% Status Management
  S1 -.->|All bookings visible to admin| Admin
  S2 -.->|Only confirmed/completed in calendar| Calendar
  A3 -.->|No calendar event created| Calendar

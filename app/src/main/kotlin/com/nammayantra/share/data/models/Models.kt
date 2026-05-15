package com.nammayantra.share.data.models

data class User(
    val uid: String = "",
    val name: String = "",
    val email: String = "",
    val role: String = "Farmer", // "Farmer" or "Owner"
    val phoneNumber: String = "",
    val location: UserLocation? = null
)

data class UserLocation(
    val lat: Double = 0.0,
    val lng: Double = 0.0,
    val address: String = ""
)

data class Machine(
    val id: String = "",
    val ownerId: String = "",
    val name: String = "",
    val category: String = "", // Tractor, Harvester, etc.
    val hourlyRate: Double = 0.0,
    val dailyRate: Double = 0.0,
    val condition: String = "Good",
    val lastServiceDate: Long = 0,
    val available: Boolean = true,
    val imageUrl: String = "",
    val description: String = "",
    val location: UserLocation? = null
)

data class Booking(
    val id: String = "",
    val machineId: String = "",
    val farmerId: String = "",
    val ownerId: String = "",
    val startDate: Long = 0,
    val duration: Int = 0, // In hours or days
    val durationUnit: String = "Hours", // "Hours" or "Days"
    val totalAmount: Double = 0.0,
    val status: String = "Pending", // Pending, Accepted, Declined, Completed
    val createdAt: Long = System.currentTimeMillis()
)

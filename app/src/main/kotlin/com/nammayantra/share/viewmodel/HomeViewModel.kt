package com.nammayantra.share.viewmodel

import androidx.lifecycle.*
import com.google.firebase.firestore.FirebaseFirestore
import com.nammayantra.share.data.models.Machine
import kotlinx.coroutines.launch

class HomeViewModel : ViewModel() {
    private val firestore = FirebaseFirestore.getInstance()
    
    private val _machines = MutableLiveData<List<Machine>>()
    val machines: LiveData<List<Machine>> = _machines

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    fun loadMachines() {
        _isLoading.value = true
        firestore.collection("machines")
            .whereEqualTo("available", true)
            .get()
            .addOnSuccessListener { result ->
                val list = result.toObjects(Machine::class.java)
                _machines.value = list
                _isLoading.value = false
            }
            .addOnFailureListener {
                _isLoading.value = false
            }
    }
}

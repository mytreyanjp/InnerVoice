import React from 'react'
import VideoStreamer from '@/pages/VideoStreamer'
import { useEffect } from 'react';

function Home() {

  const initialMessage = 'This is your inner voice! Tap on the bottom of the screen to enter SafeStreet mode.';

  const speakMessage = (message) => {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'en-US'; 
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    speakMessage(initialMessage);
  }, []); 

  return (
    <>
      <div className='text-[3rem] text-center mt-10 font-bold'>
        Inner<span className='text-[#a397d0] p-3 rounded-md'>Voice</span>
      </div>
      <p className='text-[1.5rem] text-center w-full h-full'>
        We ensure that your <span className='font-extralight text-[#a085b7]'>path</span> is clear
      </p>
      <VideoStreamer />

      {/* About Section */}
      <div className='flex flex-col text-center mt-20 w-full h-full pl-10 pr-10 bg-[#333]'>
        <div className='text-[2rem] mt-4 mb-4 sticky top-0 bg-[#333] z-10'>
          About
        </div>
        <div className='bg-[#050510] p-5 rounded-3xl mb-10 text-pretty'>
          Welcome to InnerVoice, an innovative application designed to empower visually impaired individuals with enhanced spatial awareness and independence. Our mission is to make navigation easier, safer, and more accessible, utilizing technology that is both cost-efficient and user-friendly.
        </div>

        {/* What We Do Section */}
        <div className='text-[2rem] mb-4 sticky top-0 bg-[#333] z-10'>
          What We Do?
        </div>
        <div className='bg-[#050510] p-5 rounded-3xl mb-10'>
          InnerVoice leverages the power of a simple <span className='text-[#dfbcf1]'>monocular device camera</span> to interpret the surroundings and provide real-time auditory feedback. The app continuously scans the environment through the device's camera, <span className='text-[#dfbcf1]'>detects obstacles</span>, and <span className='text-[#dfbcf1]'>narrates essential details</span> such as the direction and distance of objects in the user's path. This helps users navigate unfamiliar spaces confidently and independently.
        </div>

        {/* SafeStreet Mode */}
        <div className='text-[2rem] mb-4 sticky top-0 bg-[#333] z-10'>
          SafeStreet Mode
        </div>
        <div className='bg-[#050510] p-5 rounded-3xl mb-10'>
          One of the standout features of InnerVoice is SafeStreet Mode. Designed specifically for outdoor and indoor navigation, SafeStreet Mode guides users by detecting obstacles and alerting them to potential hazards around them. Whether it's a curb, a pole, or a parked vehicle, InnerVoice ensures that users are always aware of obstacles along their path, including their precise location and distance from the user.
        </div>
      </div>
    </>
  )
}

export default Home;

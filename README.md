Realtime CG Final Project
# WebGL Technique Reproduction
Krist Pornpairin 6031301721

# Overview

โปรเจ็คที่เราจะทำคือการนำเทคนิคต่างๆที่ใช้ในงาน graphic เน้นในส่วนของ webGL มาเขียนใหม่อีกครั้งเพื่อทำความเข้าใจ pipline และ technique แต่ละส่วนอย่างถ่องแท้จริงๆ โดยมีในส่วนที่ตั้งใจและได้จากการศึกษาเพิ่มเติม

โคดทั้งหมดที่เขียน พยามเขียนเองทั้งหมดให้ low level ที่สุด โดยมี low level library ที่ใช้คือ TWGL.js แต่ concept ก็ตังคงเดิม แค่ syntax อ่านง่ายขึ้น และแนะนำสำหรับคนต้องการเรียน openGL graphic แบบเข้าถึงกระดูก

# Resource
- Website 	https://webgl-realtimecg-project.pages.dev
- Github 	https://github.com/krist7599555/webgl-realtimecg-project
- Youtube 	https://www.youtube.com/watch?v=_wZmqFqQ5pk


# Normal Map
https://webgl-realtimecg-project.pages.dev/example-1
https://github.com/krist7599555/webgl-realtimecg-project/blob/master/src/routes/example-1.svelte


Normal map เป็นรูปแบบการแสดงผลนึงที่เลือกสีในการแสดงมาจาก normal vector แทน โดยแปลง normal vector xyz เป็น rgb หากสังเกตุดีๆแล้วจะพบว่าภาพส่วนใหญ่เป็นสีฟ้า เกิดจาก normal vector ที่เราเห็น หากมองด้านขวามจะเห็นสีแดง มาจาก vector x และด้านบนเป็นสีเขียวจาก vector y ส่วน vector z เราเห็นเสมออยู่แล้วเพราะถ้าเรามองไม่เห็น มันจะเป็นอีกด้านของวัตถุแทน
	
การใช้ normal map คิดว่ายังมีประโยชน์ส่วนตัวในการลองตรงสอบว่าของถูก render ไหมโดยไม่ต้องกำหนดแสง หรือ phong shader ใช้วุ่นวาย

ยังมีเทคนิคที่เรียกว่า normal mapping ที่จะช่วยทให้ของที่เรียบเนียนดูมีมิติมากขึ้น และ parallex mapping ที่ทำให้ normal mapping มองได้หลายๆทิศที่ยังไม่ได้ลองในส่วนนี้ด้วย

# GLTF
https://webgl-realtimecg-project.pages.dev/example-2
https://github.com/krist7599555/webgl-realtimecg-project/blob/master/src/routes/example-2.svelte

GLTF เป็น 3d model format ของ khronos group ที่ข้างในเป็น json ที่ประกอบด้วยข้อมูลหลายส่วนไม่ว่าจะเป็น scene camera bone/skeleton texture ที่ครอบคลุมเกือบทุดอย่าง ก็คาดหวังว่าจะลองทำงานไปพร้อมๆกับตัวนี้ดู เพียงแต่ว่ายังไม่ค่อยเข้าใจการทำงานเรื่อง skining เท่าไหร่ เลยได้แค่ลอง prototype ปั่น model แล้วแสดงผลด้วย THREE.js เพียงแค่นั้น

อ่าน specification ของ GLTF เพิ่มเติมได้ที่ https://github.com/KhronosGroup/glTF

# FrameBuffer
https://webgl-realtimecg-project.pages.dev/example-4
https://github.com/krist7599555/webgl-realtimecg-project/blob/master/src/routes/example-4.svelte

framebuffer เป็นสิ่งที่เราใช้ render กันจนชินไปแล้ว หน้าจอเราก็เป็นเหมือน framebuffer นึงเหมือนกัน แต่มีบางคลั้งที่เราไม่อยาก render ลงหน้าจอ แต่ render เป็น รูปภาพ แล้วนำไปใช้ต่อทีหลัง การมีของ framebuffer แยกทำให้เกิดสิ่งนั้นได้ บ้างก็ใช้ทำเงาสะท้อน บ้างก็ใช้ผลิตซ้ำ texture รวมทั้งใช้เก็บขอมูลตรงๆเช่น depth buffer ด้วยเช่นกัน

ในการเขียนจะมีส่วนที่น่าสนใจคือตอนกำหนด attachment ที่ยังงงนิดหน่อยว่านอกจาก format เป็น RGBA ก็ยังมีตัวเลือกอีกมากให้เลือกได้

อีกเทคนิคนึงที่ได้จากสิ่งนี้คือการสร้าง texture ที่ไม่จำเป็นต้องเป็น rgba ก็ได้เพื่อประหยัดทรัพยากรในการจำ แล้วก็การกำหนด min mag ก็มีผลในการแสดง texture เล็กๆได้ดี

# Shadow Mapping
https://webgl-realtimecg-project.pages.dev/example-5
https://github.com/krist7599555/webgl-realtimecg-project/blob/master/src/routes/example-5.svelte

การเขียนเงาเป็น concept ที่ใช้เพื่อเพิ่มมิติให้ภาพสมจริงขึ้น แต่เพราะ webgl เป็นแค่ drawing api เท่านั้นไม่ได้มีสมองคำนวน เราเลยต้องหาวิธีคำนวนขึ้นมาเอง โดยวิธีที่ใช้คือการ สร้าง depth framebuffer มาเพื่อเก็บความลึกโดยใช้แสงเป็นจุดอ้างอิง แล้ว render ใหม่อีกครั้งโดยครั้งที่สองทุงครั้งที่ render จะเช็คว่าหากตำแหน่งนั้น map ไปยัง depth framebuffer แล้วจะมีระยะห่างเท่ากับที่จำไว้ไหม ถ้าเท่ากันแปลว่าตแหน่งนั้นคือส่วนที่ใกล้แหล่งกำเนิดแสงที่สุดใน ray เดียวกันจึงควรเป็นส่วนสว่าง

พูดแล้วก็เหมือนง่าย แต่พอเขียนเองค่อนข้างงงมากเพราะว่า ตัว internal buffer เป็นโปรแกรมส่วนที่ไม่คุ้นเคย และการ attach เราก็ยังไม่ได้เข้าใจทุก option ทั้งหมด

# Summary

การได้ลองเขียน webgl ตั้งทั้งหมดเป็นงานที่เหนื่อยมากและใช้ leaning curve สูงจนหลายๆครั้งก็ท้อเหมือนกัน แต่การค่อยๆทำความเข้าใจอะไรบางอย่างแบบถึงแก่นก็ไม่แย่ ยังมีส่วนของ normal mapping, bone/skeleton, physic base material และอีกมากที่ยังไม่ได้ลอง แต่ก็คาดหวังว่าจะได้ลองและทำตรงนี้อยู่เพื่อจะได้สร้างงานดีๆในอนาคตที่หลายๆ device สามารถเข้าถึงได้ (อย่างน้อยก็ ios หละครับที่ support แค่ webgl 1)

ท้ายนี้ก็ขอขอบคุณอาจารย์มาด้วยเลยละกัน รู้สึกชอบ part1 ในการเรียนรู้สึกว่าได้เห็นปัญหาหลายๆแบบดี ทั้งเรื่องแสง เงา ข้อผิดพลาด ความเร็ว ช่วยทำให้ไม่ตอนทำจริงยังฮึบได้อยู่ ถ้าให้พูดผมก็คงคิดว่า graphic ถ้าแค่พูดให้เข้าใจ มันเข้าใจไม่ยากเลย แต่พอต้องมาเขียนมันคืออสุรกายตัวนึงเลยก็ว่าได้ แต่ก็ลุยต่อไปให้ ถ้ามีอะไรผมอาจจะไปถามนอกรอบนะครับ :)

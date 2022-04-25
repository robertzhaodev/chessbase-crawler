// ES 6 MW: March 1, 2020

export class Time
{
   constructor(timeAsInt) 
   {
      this.time = timeAsInt || 0;
	};
}


///////////////////////////////////////////////////////////////////
// needs to be compatible with CBDateAndTime in C++

export class DateAndTime
{
   constructor ()
   {
      this.timeVal = 0;
   };

   toDataBuf( buf )
   {
      buf.writeInt64( this.timeVal );
   };

   fromDataBuf( buf )
   {
      buf.readInt64( this.timeVal );
   };
}

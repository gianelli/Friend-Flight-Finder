#!/usr/bin/python

import urllib, urllib2, socket
import locale
from lxml import etree


#must manually bind to alternate ip address on dreamhost
#overwrites library function at runtime b/c the library doesn't expose alt IPs otherwise 
def bind_alt_socket(alt_ip):
	true_socket = socket.socket
	def bound_socket(*a, **k):
		try:
			sock = true_socket(*a, **k)
			sock.bind((alt_ip, 0))
			return sock
		except:
			return sock
	socket.socket = bound_socket
	
def debugRequest():
	#this is the most basic request (hard coded for hotel information)
	#prints the details of the HTTP request and response

	#assemble URL with formatted XML request
	uglyxml = "<HotelSessionRequest method='selectHotelInfoForHotel'><hotelId>134388</hotelId></HotelSessionRequest>"
	base = "http://axml.travelnow.com/external/xmlinterface.jsp?cid=349613&resType=hotel200631&intfc=ws&"
	url = base + urllib.urlencode({'xml':uglyxml})

	#hardcoded to adityapanda.com for now
	bind_alt_socket("75.119.213.219")
	request = urllib2.Request(url)

	#debug settings enabled
	opener = urllib2.build_opener(urllib2.HTTPHandler(debuglevel=1))

	#change how many characters of the result to read, default=300
	feeddata = opener.open(request).read(300)
	print feeddata


def formatFlightRequest(base, origin, dest, departDay, returnDay): 
	#takes base url and flight parameters: origin and destination airport codes, departure and return dates
	#returns a URL for that flight request to be posted to Expedia
	
	#concatenate all XML parameters
	openingXML = "<AirSessionRequest method=\"getAirAvailability\"><AirAvailabilityQuery>"
	originXML = "<originCityCode>" + origin + "</originCityCode>"
	destXML = "<destinationCityCode>" + dest + "</destinationCityCode>"
	departDayXML = "<departureDateTime>" + departDay + "</departureDateTime>"
	returnDayXML = "<returnDateTime>" + returnDay + "</returnDateTime>"
	passengerXML = "<Passengers><adultPassengers>1</adultPassengers></Passengers>"
	closingXML = "<xmlResultFormat>2</xmlResultFormat><searchType>2</searchType></AirAvailabilityQuery></AirSessionRequest>"
	uglyXML = openingXML + originXML + destXML + departDayXML + returnDayXML + passengerXML + closingXML
	url = base + urllib.urlencode({'xml':uglyXML})
	return url

def makeRequest(url):
	#makes the request, returns file-like object with request results
	request = urllib2.Request(url)
	#to turn on debug settings, add the argument "urllib2.HTTPHandler(debuglevel=1)"
	opener = urllib2.build_opener()
	results = opener.open(request)
	return results


def flightRequest(origin, dest, departDay, returnDay):
	#takes flight parameters, makes request, returns cheapest price (or 0 if error)
	
	base = "http://api.ean.com/external/xmlinterface.jsp?cid=349613&resType=air&intfc=ws&"
	url = formatFlightRequest(base, origin, dest, departDay, returnDay)	
	availableFlights = makeRequest(url)
	
	#load availableFlights xml file-like object into an Element tree
	tree = etree.parse(availableFlights)

	prices = tree.xpath('/AirAvailabilityResults/AirAvailabilityReply/RateInfo/displayTotalPrice')
	if not prices:
		return 0
	else:
		price = float(prices[0].text) #cheapest is always at [0]
		return price
	

def getMyPrices(origin, dests, departDay, returnDay):
	#origin should be a string with one airport code, dests should be a list of airport codes
	#returns a dictionary of { dest : price }

	#append times to dates for now (check if this is necessary in the API docs)
	departDay += " 11:00 AM"
	returnDay += " 11:00 AM"
	
	bind_alt_socket("75.119.213.219")
	
	#make requests in a loop
	results = {}
	for dest in dests:
		results[dest] = flightRequest(origin, dest, departDay, returnDay)
	return results

if __name__=="__main__":
	#for debug purposes only
	origin = raw_input("Enter the three letter airport code for your origin city: ")
	dest = raw_input("Enter the three letter airport code for your destination city: ")
	print "Looking for flights from " + origin + " to " + dest
	departDay = raw_input("Enter your departure day (MM/DD/YYYY): ")
	departDay += " 11:00 AM"
	returnDay = raw_input("Enter your return day (MM/DD/YYYY): ")
	returnDay += " 11:00 AM"
	print "... departing on " + departDay + " and returning on " + returnDay
	
	prices = flightRequest(origin, dest, departDay, returnDay)
	print "We looked through " + str(len(prices)+1) + " available flights for you."
	print "The cheapest flight from " + origin + " to " + dest + " on that date is " + prices[0].text + " dollars."



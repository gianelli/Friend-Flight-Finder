from django.template import Template, Context, loader
from django.utils import simplejson
from django.http import HttpResponse, Http404
from django.shortcuts import render_to_response, get_object_or_404
from jettsy.getFlights.models import City, Airport
from jettsy.getFlights.parseFlight import getMyPrices
import urllib
import locale

def index(request):
	return render_to_response('flight/mainpage.html')

def mainpage(request):
	return render_to_response('flight/mainpage.html')

def checkAirport(request):
	if request.is_ajax():
		if request.method == 'POST':
			airport = request.POST.get('airport')
			a = Airport.objects.filter(airport_code=airport)[0]
			city = City.objects.filter(airport=a)[0] #only looking at first
			return HttpResponse(simplejson.dumps({'city':city.name}), mimetype)
			
def getAirportForCity(request):
	if request.is_ajax():
		if request.method == 'POST':
			cityName = request.POST.get('city')
			cityName = cityName.partition(",")[0]
			
			city = City.objects.filter(name=cityName)[0] #only looking at first 
			airport = Airport.objects.filter(city=city)[0]
			
			mimetype = 'application/javascript'
			return HttpResponse(simplejson.dumps({'airport':airport.airport_code}), mimetype)
	

def testajax(request):
	if request.is_ajax():
		if request.method == 'POST':
			dest = request.POST.get('destination')
			my_loc = request.POST.get('my_location')
			departDate = request.POST.get('departDate')
			returnDate = request.POST.get('returnDate')
		
			response_dict = {}
			
			#get airport code for my_location
			my_loc_name = my_loc.split(',')[0]
			my_city = City.objects.filter(name=my_loc_name)			
			my_airport = Airport.objects.filter(city=my_city[0])[0].airport_code
			
			if (len(my_airport) == 0):
				return HttpResponse(simplejson.dumps({'error':'Error: your city was not listed in our records.'}))		
			
			#for each destination, get the airport codes
			airport_codes = []
			dest = urllib.unquote(dest)
			city_name = dest.split(',')[0]
			city = City.objects.filter(name=city_name)
			#bunch of hacks, only getting first city and first airport for now
			airport = Airport.objects.filter(city=city[0])
			airport_codes.append(airport[0].airport_code)
			
			locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
			#get the flights
			results = getMyPrices(my_airport, airport_codes, departDate, returnDate)
			for k in results: 
				response_dict['destination'] = k
				response_dict['price'] = locale.currency(results[k])
				
			
			mimetype = 'application/javascript'
			return HttpResponse(simplejson.dumps(response_dict), mimetype)
		else:
			return HttpResponse("GET success")
	else:
		return render_to_response('flight/testajax.html', {'status':'200 OK'})


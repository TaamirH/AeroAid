import React, { useState } from 'react';

const AeroAidDesignSystem = () => {
  const [activeTab, setActiveTab] = useState('colors');
  
  return (
    <div className="font-sans min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-800 to-blue-600 text-white py-8 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight mb-2">AeroAid Design System</h1>
          <p className="text-blue-100">Professional UI components for emergency drone response</p>
        </div>
      </header>
      
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-8">
            <button 
              onClick={() => setActiveTab('colors')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'colors' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Color System
            </button>
            <button 
              onClick={() => setActiveTab('typography')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'typography' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Typography
            </button>
            <button 
              onClick={() => setActiveTab('components')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'components' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Components
            </button>
            <button 
              onClick={() => setActiveTab('layouts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'layouts' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Layouts
            </button>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
        {/* Colors Section */}
        {activeTab === 'colors' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Color System</h2>
            
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Colors</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ColorSwatch color="bg-blue-800" name="Primary Dark" hex="#1E40AF" />
                <ColorSwatch color="bg-blue-600" name="Primary" hex="#2563EB" />
                <ColorSwatch color="bg-blue-500" name="Primary Light" hex="#3B82F6" />
                <ColorSwatch color="bg-blue-100" name="Primary Pale" hex="#DBEAFE" />
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Secondary Colors</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ColorSwatch color="bg-red-600" name="Emergency" hex="#DC2626" />
                <ColorSwatch color="bg-yellow-500" name="Warning" hex="#F59E0B" />
                <ColorSwatch color="bg-green-600" name="Success" hex="#16A34A" />
                <ColorSwatch color="bg-gray-600" name="Neutral" hex="#4B5563" />
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gray Scale</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ColorSwatch color="bg-gray-900" name="Gray 900" hex="#111827" />
                <ColorSwatch color="bg-gray-700" name="Gray 700" hex="#374151" />
                <ColorSwatch color="bg-gray-500" name="Gray 500" hex="#6B7280" />
                <ColorSwatch color="bg-gray-300" name="Gray 300" hex="#D1D5DB" />
                <ColorSwatch color="bg-gray-200" name="Gray 200" hex="#E5E7EB" />
                <ColorSwatch color="bg-gray-100" name="Gray 100" hex="#F3F4F6" />
                <ColorSwatch color="bg-gray-50" name="Gray 50" hex="#F9FAFB" />
                <ColorSwatch color="bg-white" name="White" hex="#FFFFFF" border="border" />
              </div>
            </div>
          </div>
        )}
        
        {/* Typography Section */}
        {activeTab === 'typography' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Typography</h2>
            
            <div className="mb-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Headings</h3>
              <div className="space-y-6 bg-white shadow rounded-lg p-6">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Heading 1</h1>
                  <p className="text-sm text-gray-500 mt-1">4xl (2.25rem) | Font Weight: Bold | Line Height: 2.5rem</p>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Heading 2</h2>
                  <p className="text-sm text-gray-500 mt-1">3xl (1.875rem) | Font Weight: Bold | Line Height: 2.25rem</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Heading 3</h3>
                  <p className="text-sm text-gray-500 mt-1">2xl (1.5rem) | Font Weight: Bold | Line Height: 2rem</p>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">Heading 4</h4>
                  <p className="text-sm text-gray-500 mt-1">xl (1.25rem) | Font Weight: Semibold | Line Height: 1.75rem</p>
                </div>
                <div>
                  <h5 className="text-lg font-semibold text-gray-900">Heading 5</h5>
                  <p className="text-sm text-gray-500 mt-1">lg (1.125rem) | Font Weight: Semibold | Line Height: 1.75rem</p>
                </div>
              </div>
            </div>
            
            <div className="mb-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Body Text</h3>
              <div className="space-y-6 bg-white shadow rounded-lg p-6">
                <div>
                  <p className="text-base text-gray-800">
                    Base Text: This is the standard body text used throughout the application. 
                    It should have good readability and contrast against background colors.
                  </p>
                  <p className="text-sm text-gray-500 mt-1">base (1rem) | Font Weight: Regular | Line Height: 1.5rem</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Small Text: Used for supplementary information, captions, and less important content.
                    It should still be legible but visually secondary to the main content.
                  </p>
                  <p className="text-sm text-gray-500 mt-1">sm (0.875rem) | Font Weight: Regular | Line Height: 1.25rem</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    Extra Small: For legal text, footnotes, and metadata that needs to be present but minimally disruptive.
                  </p>
                  <p className="text-sm text-gray-500 mt-1">xs (0.75rem) | Font Weight: Regular | Line Height: 1rem</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Components Section */}
        {activeTab === 'components' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Components</h2>
            
            <div className="mb-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Buttons</h3>
              <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Primary Buttons</h4>
                    <div className="flex flex-wrap gap-4">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors">
                        Primary Button
                      </button>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors opacity-70">
                        Disabled
                      </button>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded-md font-medium shadow-sm transition-colors">
                        Small
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Secondary Buttons</h4>
                    <div className="flex flex-wrap gap-4">
                      <button className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 px-4 py-2 rounded-md font-medium shadow-sm transition-colors">
                        Secondary Button
                      </button>
                      <button className="bg-white text-gray-400 border border-gray-300 px-4 py-2 rounded-md font-medium shadow-sm cursor-not-allowed">
                        Disabled
                      </button>
                      <button className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 px-3 py-1 text-sm rounded-md font-medium shadow-sm transition-colors">
                        Small
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Emergency Buttons</h4>
                    <div className="flex flex-wrap gap-4">
                      <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors">
                        Emergency Button
                      </button>
                      <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors opacity-70">
                        Disabled
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Text Buttons</h4>
                    <div className="flex flex-wrap gap-4">
                      <button className="text-blue-600 hover:text-blue-800 font-medium">
                        Text Button
                      </button>
                      <button className="text-gray-400 font-medium cursor-not-allowed">
                        Disabled
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cards</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                  <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-800">Basic Card</h4>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-600">A simple card component with a header and body content.</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                  <div className="bg-blue-600 px-4 py-3 border-b border-blue-500">
                    <h4 className="font-semibold text-white">Feature Card</h4>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-600">A card with a colored header for featured content.</p>
                    <button className="mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm">
                      Learn More →
                    </button>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                  <div className="bg-red-50 px-4 py-3 border-b border-red-100">
                    <h4 className="font-semibold text-red-800">Emergency Card</h4>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-600">A card styled for emergency-related information.</p>
                    <div className="flex justify-end mt-4">
                      <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm rounded-md font-medium shadow-sm transition-colors">
                        Respond
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Elements</h3>
              <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Text Inputs</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Default Input
                        </label>
                        <input
                          type="text"
                          className="shadow-sm bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm p-2.5"
                          placeholder="Enter text..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Input with Icon
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            className="shadow-sm bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 rounded-md sm:text-sm p-2.5"
                            placeholder="Search..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Select & Checkbox</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select Input
                        </label>
                        <select className="shadow-sm bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm p-2.5">
                          <option>Option 1</option>
                          <option>Option 2</option>
                          <option>Option 3</option>
                        </select>
                      </div>
                      
                      <div>
                        <div className="flex items-center">
                          <input
                            id="checkbox"
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="checkbox" className="ml-2 block text-sm text-gray-700">
                            Checkbox Label
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alerts & Notifications</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Information alert with important content.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border-l-4 border-green-500 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        Success alert for completed actions.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Warning alert for potential issues.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        Error alert for failures or critical issues.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Layouts Section */}
        {activeTab === 'layouts' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Layouts</h2>
            
            <div className="mb-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Layout</h3>
              <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="bg-blue-600 p-4 text-white">
                  <h4 className="font-semibold">Dashboard Header</h4>
                </div>
                <div className="grid grid-cols-12 gap-4 p-4">
                  <div className="col-span-12 md:col-span-8 bg-gray-100 p-4 rounded min-h-[200px]">
                    <div className="font-medium mb-2">Main Content Area</div>
                    <p className="text-sm text-gray-600">Primary dashboard content with emergency information and maps.</p>
                  </div>
                  <div className="col-span-12 md:col-span-4 space-y-4">
                    <div className="bg-gray-100 p-4 rounded min-h-[100px]">
                      <div className="font-medium mb-2">Sidebar Widget</div>
                      <p className="text-sm text-gray-600">Notifications panel</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded min-h-[80px]">
                      <div className="font-medium mb-2">Sidebar Widget</div>
                      <p className="text-sm text-gray-600">Weather information</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Detail Layout</h3>
              <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="bg-red-100 p-4 border-b border-red-200">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <h4 className="font-semibold text-red-800">Emergency Detail Header</h4>
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-4 p-4">
                  <div className="col-span-12 md:col-span-6 space-y-4">
                    <div className="bg-gray-100 p-4 rounded min-h-[100px]">
                      <div className="font-medium mb-2">Emergency Details</div>
                      <p className="text-sm text-gray-600">Information about the emergency situation</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded min-h-[100px]">
                      <div className="font-medium mb-2">Reported Findings</div>
                      <p className="text-sm text-gray-600">List of findings reported by operators</p>
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-6 bg-gray-100 p-4 rounded min-h-[220px]">
                    <div className="font-medium mb-2">Emergency Map</div>
                    <p className="text-sm text-gray-600">Interactive map showing the emergency location and operator positions</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors">
                    Respond to Emergency
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Color swatch component
const ColorSwatch = ({ color, name, hex, border }) => {
  return (
    <div className="space-y-2">
      <div className={`h-16 rounded-md ${color} ${border}`}></div>
      <div>
        <p className="font-medium text-sm">{name}</p>
        <p className="text-xs text-gray-500">{hex}</p>
      </div>
    </div>
  );
};

export default AeroAidDesignSystem;
"""
Enterprise-Grade Guardrail System for Multi-Domain AI Agent Platform
Comprehensive security, compliance, and quality governance
"""

import re
import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
import hashlib

from .schemas import GuardrailResult, QualityAssessment

logger = logging.getLogger(__name__)

# ============================================================================
# ENTERPRISE GUARDRAIL SYSTEM
# ============================================================================

class EnterpriseGuardrailSystem:
    """
    Enterprise-grade guardrail system with comprehensive security checks
    """
    
    def __init__(self):
        self.toxicity_patterns = self._load_toxicity_patterns()
        self.injection_patterns = self._load_injection_patterns()
        self.pii_patterns = self._load_pii_patterns()
        self.out_of_scope_patterns = self._load_out_of_scope_patterns()
    
    def _load_toxicity_patterns(self) -> List[str]:
        """Load toxicity detection patterns"""
        return [
            r'\b(fuck|shit|damn|hell|bitch|asshole|idiot|stupid|moron)\b',
            r'\b(kill|murder|suicide|bomb|terrorist|hate)\b',
            r'\b(racist|sexist|homophobic|discriminatory)\b',
            r'\b(illegal|crime|criminal|fraud|scam)\b',
            r'\b(violence|abuse|harassment|threat)\b'
        ]
    
    def _load_injection_patterns(self) -> List[str]:
        """Load prompt injection detection patterns"""
        return [
            r'\b(ignore|disregard|forget|override)\s+(all|previous|instructions|rules)\b',
            r'\b(act\s+as|pretend\s+to\s+be|you\s+are\s+now)\b',
            r'\b(system\s+prompt|admin\s+access|root\s+privileges)\b',
            r'\b(bypass|circumvent|hack|exploit)\b',
            r'\b(confidential|secret|classified|restricted)\b'
        ]
    
    def _load_pii_patterns(self) -> List[str]:
        """Load PII detection patterns"""
        return [
            r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',  # Credit card
            r'\b\d{3}-\d{2}-\d{4}\b',  # SSN
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email
            r'\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b',  # Phone
            r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b',  # IP address
            r'\b[A-Za-z0-9]{8}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{12}\b'  # UUID
        ]
    
    def _load_out_of_scope_patterns(self) -> List[str]:
        """Load out-of-scope detection patterns"""
        return [
            r'\b(stock\s+market|trading|investment|finance|banking)\b',
            r'\b(politics|election|government|policy)\b',
            r'\b(medical|health|diagnosis|treatment|drug)\b',
            r'\b(legal|law|attorney|court|lawsuit)\b',
            r'\b(religion|spiritual|faith|god|prayer)\b',
            r'\b(weapon|gun|ammunition|explosive)\b',
            r'\b(drug|narcotic|substance|addiction)\b'
        ]
    
    def check_guardrails(self, user_input: str, user_id: Optional[str] = None) -> GuardrailResult:
        """
        Comprehensive guardrail check with enterprise-grade security
        """
        logger.info(f"Running enterprise guardrails for user: {user_id}")
        
        # Initialize result
        result = GuardrailResult(
            passed=True,
            reason=None,
            risk_level="low",
            action_taken="allow",
            user_id=user_id
        )
        
        # Check toxicity
        toxicity_detected = self._check_toxicity(user_input)
        if toxicity_detected:
            result.toxicity_detected = True
            result.risk_level = "high"
            result.action_taken = "block"
            result.passed = False
            result.reason = "Toxic content detected"
            return result
        
        # Check injection attempts
        injection_detected = self._check_injection(user_input)
        if injection_detected:
            result.injection_detected = True
            result.risk_level = "critical"
            result.action_taken = "block"
            result.passed = False
            result.reason = "Prompt injection attempt detected"
            return result
        
        # Check PII
        pii_detected = self._check_pii(user_input)
        if pii_detected:
            result.pii_detected = True
            result.risk_level = "medium"
            result.action_taken = "escalate"
            result.passed = False
            result.reason = "PII detected - requires review"
            return result
        
        # Check out-of-scope
        out_of_scope = self._check_out_of_scope(user_input)
        if out_of_scope:
            result.out_of_scope = True
            result.risk_level = "low"
            result.action_taken = "block"
            result.passed = False
            result.reason = "Request out of scope"
            return result
        
        # Check input length and complexity
        if len(user_input) > 5000:
            result.risk_level = "medium"
            result.reason = "Input too long"
        
        # Check for suspicious patterns
        suspicious = self._check_suspicious_patterns(user_input)
        if suspicious:
            result.risk_level = "medium"
            result.action_taken = "escalate"
        
        return result
    
    def _check_toxicity(self, text: str) -> bool:
        """Check for toxic content"""
        text_lower = text.lower()
        for pattern in self.toxicity_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                logger.warning(f"Toxicity detected: {pattern}")
                return True
        return False
    
    def _check_injection(self, text: str) -> bool:
        """Check for prompt injection attempts"""
        text_lower = text.lower()
        for pattern in self.injection_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                logger.warning(f"Injection attempt detected: {pattern}")
                return True
        return False
    
    def _check_pii(self, text: str) -> bool:
        """Check for PII (Personally Identifiable Information)"""
        for pattern in self.pii_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                logger.warning(f"PII detected: {pattern}")
                return True
        return False
    
    def _check_out_of_scope(self, text: str) -> bool:
        """Check for out-of-scope requests"""
        text_lower = text.lower()
        for pattern in self.out_of_scope_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                logger.warning(f"Out-of-scope request detected: {pattern}")
                return True
        return False
    
    def _check_suspicious_patterns(self, text: str) -> bool:
        """Check for suspicious patterns"""
        # Check for excessive repetition
        words = text.split()
        if len(words) > 10:
            word_counts = {}
            for word in words:
                word_counts[word] = word_counts.get(word, 0) + 1
                if word_counts[word] > len(words) * 0.3:  # 30% repetition
                    return True
        
        # Check for excessive special characters
        special_char_count = sum(1 for c in text if not c.isalnum() and not c.isspace())
        if special_char_count > len(text) * 0.5:  # 50% special characters
            return True
        
        return False

# ============================================================================
# ENTERPRISE QUALITY ASSESSMENT SYSTEM
# ============================================================================

class EnterpriseQualityAssessment:
    """
    Enterprise-grade quality assessment for CRAG pattern implementation
    """
    
    def __init__(self):
        self.quality_thresholds = {
            'retrieval': 0.7,
            'synthesis': 0.7,
            'relevance': 0.6,
            'completeness': 0.6,
            'overall': 0.7
        }
    
    def assess_retrieval_quality(self, 
                               internal_results: List[Dict[str, Any]], 
                               external_results: List[Dict[str, Any]], 
                               query: str) -> float:
        """
        Assess quality of retrieved documents
        """
        total_results = len(internal_results) + len(external_results)
        
        if total_results == 0:
            return 0.0
        
        # Calculate relevance score
        relevance_score = self._calculate_relevance_score(
            internal_results + external_results, query
        )
        
        # Calculate completeness score
        completeness_score = self._calculate_completeness_score(
            internal_results + external_results, query
        )
        
        # Calculate diversity score
        diversity_score = self._calculate_diversity_score(
            internal_results + external_results
        )
        
        # Weighted average
        quality_score = (
            relevance_score * 0.5 +
            completeness_score * 0.3 +
            diversity_score * 0.2
        )
        
        return min(quality_score, 1.0)
    
    def assess_synthesis_quality(self, 
                                synthesis_data: Dict[str, Any], 
                                user_input: str, 
                                language: str) -> float:
        """
        Assess quality of synthesized response
        """
        if not synthesis_data:
            return 0.0
        
        response_text = synthesis_data.get('response', '')
        
        # Check completeness
        completeness = self._check_response_completeness(response_text, user_input)
        
        # Check language consistency
        language_consistency = self._check_language_consistency(response_text, language)
        
        # Check grounding
        grounding_score = self._check_grounding(synthesis_data)
        
        # Check hallucination risk
        hallucination_risk = self._assess_hallucination_risk(response_text, synthesis_data)
        
        # Weighted average
        quality_score = (
            completeness * 0.3 +
            language_consistency * 0.2 +
            grounding_score * 0.3 +
            (1 - hallucination_risk) * 0.2
        )
        
        return min(quality_score, 1.0)
    
    def _calculate_relevance_score(self, results: List[Dict[str, Any]], query: str) -> float:
        """Calculate relevance score for retrieved results"""
        if not results:
            return 0.0
        
        query_words = set(query.lower().split())
        relevant_count = 0
        
        for result in results:
            result_text = (
                result.get('title', '') + ' ' + 
                result.get('description', '') + ' ' +
                result.get('content', '')
            ).lower()
            
            result_words = set(result_text.split())
            overlap = len(query_words.intersection(result_words))
            
            if overlap > 0:
                relevant_count += 1
        
        return relevant_count / len(results)
    
    def _calculate_completeness_score(self, results: List[Dict[str, Any]], query: str) -> float:
        """Calculate completeness score for retrieved results"""
        if not results:
            return 0.0
        
        # Check if results cover different aspects of the query
        query_aspects = self._extract_query_aspects(query)
        covered_aspects = 0
        
        for aspect in query_aspects:
            for result in results:
                result_text = (
                    result.get('title', '') + ' ' + 
                    result.get('description', '') + ' ' +
                    result.get('content', '')
                ).lower()
                
                if aspect.lower() in result_text:
                    covered_aspects += 1
                    break
        
        return covered_aspects / len(query_aspects) if query_aspects else 0.0
    
    def _calculate_diversity_score(self, results: List[Dict[str, Any]]) -> float:
        """Calculate diversity score for retrieved results"""
        if len(results) <= 1:
            return 1.0
        
        # Check for unique sources, categories, or types
        unique_sources = set(result.get('source', '') for result in results)
        unique_categories = set(result.get('category', '') for result in results)
        
        diversity_score = (
            len(unique_sources) / len(results) * 0.5 +
            len(unique_categories) / len(results) * 0.5
        )
        
        return min(diversity_score, 1.0)
    
    def _check_response_completeness(self, response: str, user_input: str) -> float:
        """Check if response addresses the user's input completely"""
        if not response or not user_input:
            return 0.0
        
        # Check if response contains key information from user input
        user_words = set(user_input.lower().split())
        response_words = set(response.lower().split())
        
        overlap = len(user_words.intersection(response_words))
        completeness = overlap / len(user_words) if user_words else 0.0
        
        return min(completeness, 1.0)
    
    def _check_language_consistency(self, response: str, language: str) -> float:
        """Check if response is in the correct language"""
        if not response or not language:
            return 1.0
        
        # Simple language consistency check
        # In production, use a proper language detection library
        if language == 'en':
            # Check for English patterns
            english_patterns = ['the', 'and', 'or', 'but', 'in', 'on', 'at']
            english_count = sum(1 for pattern in english_patterns if pattern in response.lower())
            return min(english_count / len(english_patterns), 1.0)
        
        # For other languages, assume consistency for now
        return 1.0
    
    def _check_grounding(self, synthesis_data: Dict[str, Any]) -> float:
        """Check if response is grounded in retrieved data"""
        if not synthesis_data:
            return 0.0
        
        response = synthesis_data.get('response', '')
        sources = synthesis_data.get('sources', [])
        
        if not sources:
            return 0.0
        
        # Check if response references sources
        source_references = 0
        for source in sources:
            if source.get('title', '').lower() in response.lower():
                source_references += 1
        
        return source_references / len(sources) if sources else 0.0
    
    def _assess_hallucination_risk(self, response: str, synthesis_data: Dict[str, Any]) -> float:
        """Assess risk of hallucination in response"""
        if not response or not synthesis_data:
            return 1.0
        
        sources = synthesis_data.get('sources', [])
        if not sources:
            return 1.0
        
        # Check if response contains information not in sources
        source_text = ' '.join(
            source.get('title', '') + ' ' + source.get('description', '') 
            for source in sources
        ).lower()
        
        response_words = set(response.lower().split())
        source_words = set(source_text.split())
        
        # Calculate overlap
        overlap = len(response_words.intersection(source_words))
        hallucination_risk = 1 - (overlap / len(response_words)) if response_words else 1.0
        
        return min(hallucination_risk, 1.0)
    
    def _extract_query_aspects(self, query: str) -> List[str]:
        """Extract different aspects from a query"""
        # Simple aspect extraction
        aspects = []
        
        # Check for question words
        question_words = ['what', 'how', 'when', 'where', 'why', 'who']
        for word in question_words:
            if word in query.lower():
                aspects.append(word)
        
        # Check for specific entities
        entities = ['price', 'location', 'features', 'availability', 'contact']
        for entity in entities:
            if entity in query.lower():
                aspects.append(entity)
        
        return aspects if aspects else ['general']

# ============================================================================
# ENTERPRISE AUDIT TRAIL SYSTEM
# ============================================================================

class EnterpriseAuditTrail:
    """
    Enterprise-grade audit trail system for compliance and debugging
    """
    
    def __init__(self):
        self.audit_log = []
    
    def log_guardrail_check(self, 
                           user_input: str, 
                           result: GuardrailResult, 
                           user_id: Optional[str] = None) -> str:
        """Log guardrail check result"""
        audit_id = self._generate_audit_id()
        
        audit_entry = {
            'audit_id': audit_id,
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': 'guardrail_check',
            'user_id': user_id,
            'input_hash': self._hash_input(user_input),
            'result': result.dict(),
            'risk_level': result.risk_level
        }
        
        self.audit_log.append(audit_entry)
        logger.info(f"Guardrail audit logged: {audit_id}")
        
        return audit_id
    
    def log_quality_assessment(self, 
                              assessment: QualityAssessment, 
                              conversation_id: str) -> str:
        """Log quality assessment result"""
        audit_id = self._generate_audit_id()
        
        audit_entry = {
            'audit_id': audit_id,
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': 'quality_assessment',
            'conversation_id': conversation_id,
            'assessment': assessment.dict(),
            'overall_score': assessment.overall_score
        }
        
        self.audit_log.append(audit_entry)
        logger.info(f"Quality assessment audit logged: {audit_id}")
        
        return audit_id
    
    def _generate_audit_id(self) -> str:
        """Generate unique audit ID"""
        timestamp = datetime.utcnow().isoformat()
        return hashlib.md5(timestamp.encode()).hexdigest()[:16]
    
    def _hash_input(self, user_input: str) -> str:
        """Hash user input for privacy"""
        return hashlib.sha256(user_input.encode()).hexdigest()[:32]

# ============================================================================
# ENTERPRISE GUARDRAIL ENTRY POINT
# ============================================================================

def run_enterprise_guardrails(user_input: str, user_id: Optional[str] = None) -> GuardrailResult:
    """
    Enterprise guardrail entry point
    """
    guardrail_system = EnterpriseGuardrailSystem()
    return guardrail_system.check_guardrails(user_input, user_id)

def assess_enterprise_quality(internal_results: List[Dict[str, Any]], 
                            external_results: List[Dict[str, Any]], 
                            synthesis_data: Dict[str, Any], 
                            user_input: str, 
                            language: str) -> QualityAssessment:
    """
    Enterprise quality assessment entry point
    """
    quality_system = EnterpriseQualityAssessment()
    
    retrieval_quality = quality_system.assess_retrieval_quality(
        internal_results, external_results, user_input
    )
    
    synthesis_quality = quality_system.assess_synthesis_quality(
        synthesis_data, user_input, language
    )
    
    # Calculate overall score
    overall_score = (retrieval_quality + synthesis_quality) / 2
    
    return QualityAssessment(
        overall_score=overall_score,
        retrieval_quality=retrieval_quality,
        synthesis_quality=synthesis_quality,
        relevance_score=retrieval_quality,
        completeness_score=synthesis_quality,
        hallucination_risk=1 - synthesis_quality,
        grounding_score=retrieval_quality,
        language_consistency=synthesis_quality,
        needs_retry=overall_score < 0.7,
        retry_reason="Quality below threshold" if overall_score < 0.7 else None
    )
